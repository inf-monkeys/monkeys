export enum ValidationIssueType {
  ERROR = 'ERROR',
  WANTING = 'WANTING',
}

export enum ValidationReasonType {
  VALUE_REQUIRED = 'VALUE_REQUIRED',
  VALUE_TYPE_NOT_MATCH = 'VALUE_TYPE_NOT_MATCH',
  DO_WHILE_EMPTY_LOOP_OVER = 'DO_WHILE_EMPTY_LOOP_OVER',
}

export interface IValidationIssueReason {
  type: ValidationReasonType;
  name: string;
}

export interface IWorkflowValidationIssue {
  taskReferenceName: string;
  issueType: ValidationIssueType;
  detailReason: IValidationIssueReason;
  humanMessage: {
    en: string;
    zh: string;
  };
}

export interface IWorkflowValidation {
  validationIssues: IWorkflowValidationIssue[];
  validated: boolean;
}
