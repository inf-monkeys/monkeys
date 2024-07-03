import { I18nValue, ToolCredentialItem, ToolExtraInfo, ToolProperty } from '@inf-monkeys/monkeys';
import { ApiExtension } from '@nestjs/swagger';

export function MonkeyToolName(name: string): MethodDecorator {
  return (target: any, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    ApiExtension('x-monkey-tool-name', name)(target, key, descriptor);
  };
}

export function MonkeyToolDisplayName(displayName: string | I18nValue): MethodDecorator {
  return (target: any, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    ApiExtension('x-monkey-tool-display-name', displayName)(target, key, descriptor);
  };
}

export function MonkeyToolDescription(description: string | I18nValue): MethodDecorator {
  return (target: any, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    ApiExtension('x-monkey-tool-description', description)(target, key, descriptor);
  };
}

export function MonkeyToolIcon(icon: string): MethodDecorator {
  return (target: any, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    ApiExtension('x-monkey-tool-icon', icon)(target, key, descriptor);
  };
}

export function MonkeyToolCategories(categories: string[]): MethodDecorator {
  return (target: any, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    ApiExtension('x-monkey-tool-categories', categories)(target, key, descriptor);
  };
}

export function MonkeyToolInput(input: ToolProperty[]): MethodDecorator {
  return (target: any, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    ApiExtension('x-monkey-tool-input', input)(target, key, descriptor);
  };
}

export function MonkeyToolOutput(output: ToolProperty[]): MethodDecorator {
  return (target: any, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    ApiExtension('x-monkey-tool-output', output)(target, key, descriptor);
  };
}

export function MonkeyToolExtra(extra: ToolExtraInfo): MethodDecorator {
  return (target: any, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    ApiExtension('x-monkey-tool-extra', extra)(target, key, descriptor);
  };
}

export function MonkeyToolCredentials(credentials: ToolCredentialItem[]): MethodDecorator {
  return (target: any, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    ApiExtension('x-monkey-tool-credentials', credentials)(target, key, descriptor);
  };
}
