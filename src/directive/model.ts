export interface CreateDirectiveRequest {
  emailFromAuthToken: string;
  archiveId: string;
  type: string;
  trigger: {
    type: string;
  };
  stewardAccountId?: string;
  note?: string;
}

export interface UpdateDirectiveRequest {
  emailFromAuthToken: string;
  type?: string;
  trigger?: {
    type?: string;
  };
  stewardEmail?: string;
  note?: string;
}

export interface DirectiveTrigger {
  directiveTriggerId: string;
  directiveId: string;
  type: string;
  createdDt: Date;
  updatedDt: Date;
}

export interface Directive {
  directiveId: string;
  archiveId: string;
  type: string;
  createdDt: Date;
  updatedDt: Date;
  trigger: DirectiveTrigger;
  stewardAccountId?: string;
  note?: string;
  executionDt?: Date;
}

export interface DirectiveExecutionResult {
  archiveId: string;
  directiveId: string;
  outcome: "error" | "success";
  errorMessage?: string;
}
