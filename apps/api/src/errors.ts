export class AppError extends Error {
  readonly status: number;
  readonly title: string;
  readonly isOperational = true;

  constructor(
    status: number,
    title: string,
    detail?: string,
    options?: { cause?: unknown },
  ) {
    super(detail ?? title, options);
    this.name = new.target.name;
    this.status = status;
    this.title = title;
  }
}

export class NotFoundError extends AppError {
  constructor(detail?: string, options?: { cause?: unknown }) {
    super(404, "Not Found", detail, options);
  }
}
