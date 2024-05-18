import { Request, Response } from "express";

export const onIncompletePaymentFound = async (req: Request, res: Response) => {
  try {
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
};
export const onPaymentApproval = async (req: Request, res: Response) => {
  try {
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
};
export const onPaymentCompletion = async (req: Request, res: Response) => {
  try {
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
};
export const onPaymentCancellation = async (req: Request, res: Response) => {
  try {
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
};
export const onPaymentRefund = async (req: Request, res: Response) => {
  try {
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
};
