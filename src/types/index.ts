export interface Boss {
  id: string;
  name: string;
  family: string;
  crystalValue: number;
}

export interface BossFamily {
  family: string;
  bosses: Boss[];
}

export interface Mule {
  id: string;
  name: string;
  level: number;
  muleClass: string;
  selectedBosses: string[];
}