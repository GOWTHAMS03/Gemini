terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ==============================================================================
# 1. VPC & NETWORKING CONFIGURATION
# ==============================================================================
resource "aws_vpc" "b2b_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "b2b-vpc-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.b2b_vpc.id

  tags = {
    Name = "b2b-igw-${var.environment}"
  }
}

# Public Subnets (EC2)
resource "aws_subnet" "public_subnet_1" {
  vpc_id                  = aws_vpc.b2b_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "b2b-public-subnet-1"
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.b2b_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name = "b2b-public-subnet-2"
  }
}

# Private Subnets (RDS & ElastiCache)
resource "aws_subnet" "private_subnet_1" {
  vpc_id            = aws_vpc.b2b_vpc.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "b2b-private-subnet-1"
  }
}

resource "aws_subnet" "private_subnet_2" {
  vpc_id            = aws_vpc.b2b_vpc.id
  cidr_block        = "10.0.20.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name = "b2b-private-subnet-2"
  }
}

# Route Table for Public Subnets
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.b2b_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "b2b-public-rt"
  }
}

resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_subnet_1.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}

# ==============================================================================
# 2. SECURITY GROUPS
# ==============================================================================

# EC2 Security Group
resource "aws_security_group" "ec2_sg" {
  name        = "b2b-ec2-sg"
  description = "Allow HTTP, HTTPS, and SSH traffic"
  vpc_id      = aws_vpc.b2b_vpc.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "b2b-ec2-sg"
  }
}

# RDS Security Group (Restricted to EC2 SG)
resource "aws_security_group" "rds_sg" {
  name        = "b2b-rds-sg"
  description = "Allow PostgreSQL access ONLY from EC2 Security Group"
  vpc_id      = aws_vpc.b2b_vpc.id

  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "b2b-rds-sg"
  }
}

# ElastiCache Security Group (Restricted to EC2 SG)
resource "aws_security_group" "redis_sg" {
  name        = "b2b-redis-sg"
  description = "Allow Redis access ONLY from EC2 Security Group"
  vpc_id      = aws_vpc.b2b_vpc.id

  ingress {
    description     = "Redis from EC2"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "b2b-redis-sg"
  }
}

# ==============================================================================
# 3. AWS EC2 INSTANCE & ELASTIC IP
# ==============================================================================

# Key Pair for SSH
resource "aws_key_pair" "deployer" {
  key_name   = "b2b-deployer-key"
  public_key = var.ssh_public_key
}

# Ubuntu 22.04 LTS AMI Lookup
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "app_server" {
  ami                  = data.aws_ami.ubuntu.id
  instance_type        = var.ec2_instance_type
  subnet_id            = aws_subnet.public_subnet_1.id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  key_name             = aws_key_pair.deployer.key_name

  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    delete_on_termination = true
  }

  tags = {
    Name        = "b2b-app-server"
    Environment = var.environment
  }
}

# Elastic IP for Static Server IP Address
resource "aws_eip" "app_eip" {
  instance = aws_instance.app_server.id
  domain   = "vpc"

  tags = {
    Name = "b2b-app-eip"
  }
}

# ==============================================================================
# 4. AWS RDS POSTGRESQL DATABASE
# ==============================================================================
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "b2b-db-subnet-group"
  subnet_ids = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]

  tags = {
    Name = "b2b-db-subnet-group"
  }
}

resource "aws_db_instance" "postgres" {
  identifier             = "b2b-postgres-db"
  allocated_storage      = 20
  max_allocated_storage  = 100
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.t4g.micro"
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true
  publicly_accessible    = false

  tags = {
    Name        = "b2b-rds-postgres"
    Environment = var.environment
  }
}

# ==============================================================================
# 5. AWS ELASTICACHE REDIS CLUSTER
# ==============================================================================
resource "aws_elasticache_subnet_group" "redis_subnet_group" {
  name       = "b2b-redis-subnet-group"
  subnet_ids = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "b2b-redis-cluster"
  engine               = "redis"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis_subnet_group.name
  security_group_ids   = [aws_security_group.redis_sg.id]

  tags = {
    Name        = "b2b-elasticache-redis"
    Environment = var.environment
  }
}

# ==============================================================================
# 6. ROUTE 53 DNS RECORD (OPTIONAL - ONLY IF DOMAIN_NAME IS PROVIDED)
# ==============================================================================
data "aws_route53_zone" "primary" {
  count        = var.domain_name != "" && var.domain_name != "yourdomain.com" ? 1 : 0
  name         = var.domain_name
  private_zone = false
}

resource "aws_route53_record" "apex" {
  count   = length(data.aws_route53_zone.primary) > 0 ? 1 : 0
  zone_id = data.aws_route53_zone.primary[0].zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = [aws_eip.app_eip.public_ip]
}

