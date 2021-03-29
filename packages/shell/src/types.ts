export interface IShell {
  onNext: () => void;
  progress?: {
    value: number;
    max: number;
  };
  onClose?: () => void;
  onPrevious?: () => void;
}
