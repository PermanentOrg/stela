export interface CreateDirectiveRequest {
  emailFromAuthToken: string;
  archiveId: string;
  type: string;
  trigger: {
    type: string;
  };
  stewardEmail?: string;
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
  createdDt: string;
  updatedDt: string;
}

export interface Directive {
  directiveId: string;
  archiveId: string;
  type: string;
  createdDt: string;
  updatedDt: string;
  trigger: DirectiveTrigger;
  steward?: DirectiveSteward;
  note?: string;
  executionDt?: string;
}

export interface DirectiveExecutionResult {
  archiveId: string;
  directiveId: string;
  outcome: "error" | "success";
  errorMessage?: string;
}

export interface DirectiveSteward {
  email: string;
  name: string;
}
