export {};

declare global {
  namespace Bitflow {
    export type Task = {
      name: string;
      description?: string;
      subtype: string;
      view: any;
      evaluation?: any & {
        mode: "auto" | "skip" | "manual";
        enableRetry: boolean;
        showFeedback: boolean;
      };
      feedback?: any;
    };

    export type TaskStatistic = Record<string, any> & {
      subtype: string;
      count: number;
    };

    export type TaskAnswer = Record<string, any> & {
      subtype: string;
    };

    export type TaskResult = Record<string, any> & {
      subtype: string;
      state: "unknown" | "manual" | "correct" | "wrong";
      allowRetry?: boolean;
    };

    export type Input = {
      name: string;
      description?: string;
      subtype: string;
      view: Record<string, any>;
    };

    export type Title = {
      name: string;
      description?: string;
      subtype: string;
      view: Record<string, any>;
    };

    export type Start = {
      name: string;
      description?: string;
      subtype: string;
      view: Record<string, any>;
    };

    export type End = {
      name: string;
      description?: string;
      subtype: string;
      view: Record<string, any>;
    };
  }
}
