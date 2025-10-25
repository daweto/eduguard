// Grade and Stage types

export interface Stage {
  id: string;
  name: string;
  displayName: string;
  order: number;
  description: string | null;
  createdAt: string;
}

export interface Grade {
  id: string;
  name: string;
  displayName: string;
  stageId: string;
  order: number;
  createdAt: string;
}

export interface GetStagesResponse {
  stages: Stage[];
}

export interface GetGradesResponse {
  grades: Grade[];
}
