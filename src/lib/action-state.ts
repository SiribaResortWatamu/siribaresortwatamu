/**
 * Shared shape for every form action's return value.
 *
 * This lives outside the `"use server"` modules on purpose: those files may
 * only export async functions, so the constant and the type would be a build
 * error if they were declared alongside the actions.
 */
export type ActionState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }
  | {
      status: "success";
      message: string;
      reference?: string;
      detail?: string;
    };

export const IDLE: ActionState = { status: "idle" };

export function actionError(
  message: string,
  fieldErrors?: Record<string, string>,
): ActionState {
  return { status: "error", message, fieldErrors };
}

export function actionSuccess(
  message: string,
  extra?: { reference?: string; detail?: string },
): ActionState {
  return { status: "success", message, ...extra };
}
