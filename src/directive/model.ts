export interface CreateDirectiveRequest {
  emailFromAuthToken: string;
  archiveId: number;
  type: string;
  trigger: {
    type: string;
  };
  stewardAccountId?: number;
  note?: string;
}

export interface DirectiveTrigger {
  directiveTriggerId: number;
  directiveId: number;
  type: string;
  createdDt: Date;
  updatedDt: Date;
}

export interface Directive {
  directiveId: number;
  archiveId: number;
  type: string;
  createdDt: Date;
  updatedDt: Date;
  trigger: DirectiveTrigger;
  stewardAccountId?: number;
  note?: string;
  executionDt?: Date;
}
