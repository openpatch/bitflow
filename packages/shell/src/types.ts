export interface IShell {
  onNext: () => Promise<void>;
  progress?: {
    value: number;
    max: number;
  };
  onClose?: () => Promise<void>;
  onPrevious?: () => Promise<void>;
}
