export type ProductionStatus = 'PLANNED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface DefectLog {
  reason: 'Over-baked / Burnt' | 'Packaging Seal Failure' | 'Weight Mismatch' | 'Dough Collapse' | 'Machine Jam / Mold Defect';
  quantity: number;
}

export interface BOMRequirement {
  materialName: string;
  requiredQty: number;
  unit: string;
  availableStock: number;
  isSufficient: boolean;
}

export interface ProductionRunItem {
  id: number;
  runNumber: string;
  product: string;
  planned: number;
  actual: number;
  rejected: number;
  waste: number;
  status: ProductionStatus;
  batch: string;
  operator: string;
  machine: string;
  shift: 'Morning (06:00 - 14:00)' | 'Afternoon (14:00 - 22:00)' | 'Night (22:00 - 06:00)';
  startTime?: string;
  endTime?: string;
  notes?: string;
  defects?: DefectLog[];
  bomRequirements?: BOMRequirement[];
  recipeId?: number;
}

export interface ProductionStats {
  totalRuns: number;
  completedRuns: number;
  inProgressRuns: number;
  plannedRuns: number;
  totalPlannedOutput: number;
  totalActualOutput: number;
  averageYieldEfficiency: number;
  totalRejectedUnits: number;
  totalWasteKg: number;
}

const STORAGE_KEY = 'b2b_production_runs_v2';

const defaultRuns: ProductionRunItem[] = [];

class ProductionService {
  private getLocalRuns(): ProductionRunItem[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultRuns));
      return defaultRuns;
    }
    try {
      return JSON.parse(data);
    } catch {
      return defaultRuns;
    }
  }

  private saveLocalRuns(runs: ProductionRunItem[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
  }

  public getProductionRuns(): ProductionRunItem[] {
    return this.getLocalRuns();
  }

  public addProductionRun(payload: {
    product: string;
    planned: number;
    machine: string;
    operator: string;
    shift: ProductionRunItem['shift'];
    notes?: string;
  }): ProductionRunItem {
    const runs = this.getLocalRuns();
    const newRun: ProductionRunItem = {
      id: Date.now(),
      runNumber: `RUN-${Date.now().toString().slice(-8)}`,
      product: payload.product,
      planned: payload.planned,
      actual: 0,
      rejected: 0,
      waste: 0,
      status: 'PLANNED',
      batch: `BATCH-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(100 + Math.random() * 900)}`,
      operator: payload.operator,
      machine: payload.machine,
      shift: payload.shift,
      notes: payload.notes || '',
      bomRequirements: this.generateBOMForProduct(payload.product, payload.planned)
    };

    const updated = [newRun, ...runs];
    this.saveLocalRuns(updated);
    return newRun;
  }

  public startRun(id: number): ProductionRunItem[] {
    const runs = this.getLocalRuns();
    const nowStr = new Date().toLocaleString();
    const updated = runs.map(r => r.id === id ? { ...r, status: 'IN_PROGRESS' as ProductionStatus, startTime: nowStr } : r);
    this.saveLocalRuns(updated);
    return updated;
  }

  public pauseRun(id: number): ProductionRunItem[] {
    const runs = this.getLocalRuns();
    const updated = runs.map(r => r.id === id ? { ...r, status: 'PAUSED' as ProductionStatus } : r);
    this.saveLocalRuns(updated);
    return updated;
  }

  public completeRun(id: number, payload: {
    actual: number;
    rejected: number;
    waste: number;
    notes?: string;
    defects?: DefectLog[];
  }): ProductionRunItem[] {
    const runs = this.getLocalRuns();
    const nowStr = new Date().toLocaleString();
    const updated = runs.map(r => {
      if (r.id === id) {
        return {
          ...r,
          actual: payload.actual,
          rejected: payload.rejected,
          waste: payload.waste,
          notes: payload.notes || r.notes,
          defects: payload.defects || [],
          status: 'COMPLETED' as ProductionStatus,
          endTime: nowStr
        };
      }
      return r;
    });
    this.saveLocalRuns(updated);
    return updated;
  }

  public cancelRun(id: number, reason?: string): ProductionRunItem[] {
    const runs = this.getLocalRuns();
    const nowStr = new Date().toLocaleString();
    const updated = runs.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: 'CANCELLED' as ProductionStatus,
          endTime: nowStr,
          notes: reason ? `[CANCELLED]: ${reason}` : r.notes
        };
      }
      return r;
    });
    this.saveLocalRuns(updated);
    return updated;
  }

  public calculateStats(runs: ProductionRunItem[]): ProductionStats {
    const completed = runs.filter(r => r.status === 'COMPLETED');
    const totalPlannedOutput = runs.reduce((acc, r) => acc + r.planned, 0);
    const totalActualOutput = completed.reduce((acc, r) => acc + r.actual, 0);
    const totalPlannedForCompleted = completed.reduce((acc, r) => acc + r.planned, 0);
    const averageYieldEfficiency = totalPlannedForCompleted > 0 
      ? Math.min(100, Math.round((totalActualOutput / totalPlannedForCompleted) * 100))
      : 0;

    return {
      totalRuns: runs.length,
      completedRuns: completed.length,
      inProgressRuns: runs.filter(r => r.status === 'IN_PROGRESS').length,
      plannedRuns: runs.filter(r => r.status === 'PLANNED').length,
      totalPlannedOutput,
      totalActualOutput,
      averageYieldEfficiency,
      totalRejectedUnits: completed.reduce((acc, r) => acc + r.rejected, 0),
      totalWasteKg: completed.reduce((acc, r) => acc + r.waste, 0),
    };
  }

  public generateBOMForProduct(productName: string, plannedQty: number): BOMRequirement[] {
    const ratio = plannedQty / 100;
    if (productName.includes('White Bread')) {
      return [
        { materialName: 'Refined Wheat Flour (Maida)', requiredQty: Number((10 * ratio).toFixed(1)), unit: 'KG', availableStock: 850, isSufficient: true },
        { materialName: 'Granulated Sugar', requiredQty: Number((1.2 * ratio).toFixed(1)), unit: 'KG', availableStock: 210, isSufficient: true },
        { materialName: 'Baker Yeast (Active Dry)', requiredQty: Number((0.4 * ratio).toFixed(1)), unit: 'KG', availableStock: 45, isSufficient: true },
        { materialName: 'Refined Sunflower Oil', requiredQty: Number((0.8 * ratio).toFixed(1)), unit: 'LTR', availableStock: 120, isSufficient: true },
      ];
    } else if (productName.includes('Wheat Milk')) {
      return [
        { materialName: 'Atta / Whole Wheat Flour', requiredQty: Number((12 * ratio).toFixed(1)), unit: 'KG', availableStock: 400, isSufficient: true },
        { materialName: 'Full Cream Milk Powder', requiredQty: Number((1.5 * ratio).toFixed(1)), unit: 'KG', availableStock: 65, isSufficient: true },
        { materialName: 'Baker Yeast (Active Dry)', requiredQty: Number((0.5 * ratio).toFixed(1)), unit: 'KG', availableStock: 45, isSufficient: true },
      ];
    } else if (productName.includes('Bun')) {
      return [
        { materialName: 'Refined Wheat Flour (Maida)', requiredQty: Number((8 * ratio).toFixed(1)), unit: 'KG', availableStock: 850, isSufficient: true },
        { materialName: 'Unsalted Dairy Butter', requiredQty: Number((1.0 * ratio).toFixed(1)), unit: 'KG', availableStock: 4, isSufficient: 4 >= 1.0 * ratio },
        { materialName: 'Granulated Sugar', requiredQty: Number((1.8 * ratio).toFixed(1)), unit: 'KG', availableStock: 210, isSufficient: true },
      ];
    } else {
      return [
        { materialName: 'Refined Wheat Flour (Maida)', requiredQty: Number((6 * ratio).toFixed(1)), unit: 'KG', availableStock: 850, isSufficient: true },
        { materialName: 'Tutti Frutti / Dried Fruit Bits', requiredQty: Number((2 * ratio).toFixed(1)), unit: 'KG', availableStock: 50, isSufficient: true },
        { materialName: 'Unsalted Dairy Butter', requiredQty: Number((1.5 * ratio).toFixed(1)), unit: 'KG', availableStock: 4, isSufficient: 4 >= 1.5 * ratio },
      ];
    }
  }
}

export const productionService = new ProductionService();
