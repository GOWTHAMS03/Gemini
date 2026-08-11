-- V7__fix_fleet_and_dispatch_foreign_keys.sql
-- Fixes foreign key constraints on dispatch_groups, trips, and weekly_trip_plans to prevent constraint violation errors on delete

-- 1. Drop existing restrictive constraints if present
ALTER TABLE dispatch_groups DROP CONSTRAINT IF EXISTS fk959nph4kq579s0oups6glc4wg;
ALTER TABLE dispatch_groups DROP CONSTRAINT IF EXISTS fkdtfv7furnosg2d3ijxvklopfn;
ALTER TABLE dispatch_groups DROP CONSTRAINT IF EXISTS fkrstt4ayosmlvattpljr4wl17r;
ALTER TABLE dispatch_group_sales_persons DROP CONSTRAINT IF EXISTS fkgw7vo8jen3qi5xcon7bqcpsov;
ALTER TABLE dispatch_group_sales_persons DROP CONSTRAINT IF EXISTS fko6r63s2yroqx0s0vmwug321pp;
ALTER TABLE weekly_trip_plans DROP CONSTRAINT IF EXISTS fk2e2j1wq9x7or7dd66ob0ofgc3;
ALTER TABLE trips DROP CONSTRAINT IF EXISTS fk8yq4bscqn0do23frhqxuju9nt;
ALTER TABLE trips DROP CONSTRAINT IF EXISTS fkqahsaodjirbk4if91c9bfnlgg;
ALTER TABLE trips DROP CONSTRAINT IF EXISTS fk7v8ay6m4olbo05eh0txnh3n7c;
ALTER TABLE trips DROP CONSTRAINT IF EXISTS fkc4bs1fyinb8aw9pc740991lv7;

-- 2. Make columns nullable on dispatch_groups
ALTER TABLE dispatch_groups ALTER COLUMN vehicle_id DROP NOT NULL;
ALTER TABLE dispatch_groups ALTER COLUMN driver_id DROP NOT NULL;
ALTER TABLE dispatch_groups ALTER COLUMN sales_person_id DROP NOT NULL;

-- 3. Re-add foreign keys with ON DELETE SET NULL and CASCADE
ALTER TABLE dispatch_groups
    ADD CONSTRAINT fk_dispatch_groups_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL;

ALTER TABLE dispatch_groups
    ADD CONSTRAINT fk_dispatch_groups_driver FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE dispatch_groups
    ADD CONSTRAINT fk_dispatch_groups_sales_person FOREIGN KEY (sales_person_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE dispatch_group_sales_persons
    ADD CONSTRAINT fk_dg_sp_group FOREIGN KEY (dispatch_group_id) REFERENCES dispatch_groups(id) ON DELETE CASCADE;

ALTER TABLE dispatch_group_sales_persons
    ADD CONSTRAINT fk_dg_sp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE weekly_trip_plans
    ADD CONSTRAINT fk_weekly_trip_dispatch_group FOREIGN KEY (dispatch_group_id) REFERENCES dispatch_groups(id) ON DELETE SET NULL;

ALTER TABLE trips
    ADD CONSTRAINT fk_trips_dispatch_group FOREIGN KEY (dispatch_group_id) REFERENCES dispatch_groups(id) ON DELETE SET NULL;

ALTER TABLE trips
    ADD CONSTRAINT fk_trips_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL;

ALTER TABLE trips
    ADD CONSTRAINT fk_trips_driver FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL;
