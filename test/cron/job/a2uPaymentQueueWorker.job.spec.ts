import runA2UPaymentQueueWorker from "../../../src/cron/jobs/a2uPaymentQueueWorker.job";
import A2UPaymentQueue, { A2U_STATUS } from '../../../src/models/A2UPaymentQueue';
import { createA2UPayment } from "../../../src/services/payment.service";

jest.mock("../../../src/models/A2UPaymentQueue");
jest.mock('../../../src/services/payment.service');

describe('runA2UPaymentQueueWorker function', () => {
  const a2uPaymentQueueRecord = {
    _id: 'mock_a2u_payment_queue_id',
    sellerPiUid: 'sellerPiUid_TEST',
    amount: 10,
    xRef_ids: [],
    attempts: 0
  };

  const mockedA2UPaymentQueue = A2UPaymentQueue as jest.Mocked<typeof A2UPaymentQueue>;
  const mockedA2UPayment = createA2UPayment as jest.Mock;

  it("should exit early if no eligible A2U Payment job instance is found", async () => {
    mockedA2UPaymentQueue.findOneAndUpdate.mockResolvedValue(null);

    await runA2UPaymentQueueWorker();

    expect(mockedA2UPaymentQueue.findOneAndUpdate).toHaveBeenCalled();
    expect(mockedA2UPayment).not.toHaveBeenCalled();
    expect(mockedA2UPaymentQueue.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("should process an eligible A2U Payment job instance successfully", async () => {
    mockedA2UPaymentQueue.findOneAndUpdate.mockResolvedValue(a2uPaymentQueueRecord);
    mockedA2UPayment.mockResolvedValue({}) // assume successsful A2U Payment creation
    mockedA2UPaymentQueue.findByIdAndUpdate.mockResolvedValue({
      ...a2uPaymentQueueRecord,
      status: A2U_STATUS.COMPLETED,
      last_error: null
    });

    await runA2UPaymentQueueWorker();

    expect(mockedA2UPayment).toHaveBeenCalledWith({
      sellerPiUid: a2uPaymentQueueRecord.sellerPiUid,
      amount: a2uPaymentQueueRecord.amount.toString(),
      memo: "A2U payment",
      xRefIds: a2uPaymentQueueRecord.xRef_ids,
    });
    expect(mockedA2UPaymentQueue.findByIdAndUpdate).toHaveBeenCalledWith('mock_a2u_payment_queue_id', {
      status: A2U_STATUS.COMPLETED,
      updatedAt: expect.any(Date),
      last_a2u_date: expect.any(Date),
      last_error: null,
    });
  });

  it("should retry failed A2U Payment processing if job instance is under max attempts", async () => {
    mockedA2UPaymentQueue.findOneAndUpdate.mockResolvedValue({
      ...a2uPaymentQueueRecord,
      attempts: 1
    });
    mockedA2UPayment.mockRejectedValue(new Error('Mock database error')); 
    mockedA2UPaymentQueue.findByIdAndUpdate.mockResolvedValue({
      ...a2uPaymentQueueRecord,
      status: A2U_STATUS.PENDING,
      last_error: 'Mock database error',
      updatedAt: expect.any(Date)
    });

    await runA2UPaymentQueueWorker();

    expect(mockedA2UPayment).toHaveBeenCalledWith({
      sellerPiUid: a2uPaymentQueueRecord.sellerPiUid,
      amount: a2uPaymentQueueRecord.amount.toString(),
      memo: "A2U payment",
      xRefIds: a2uPaymentQueueRecord.xRef_ids,
    });
    expect(mockedA2UPaymentQueue.findByIdAndUpdate).toHaveBeenCalledWith('mock_a2u_payment_queue_id', {
      status: A2U_STATUS.PENDING,
      updatedAt: expect.any(Date),
      last_error: 'Mock database error'
    });
  });

  it("should mark job instance as failed after max attempts with A2U Payment processing", async () => {
    mockedA2UPaymentQueue.findOneAndUpdate.mockResolvedValue({
      ...a2uPaymentQueueRecord,
      attempts: 3
    });
    mockedA2UPayment.mockRejectedValue(new Error('Mock database error')); 
    mockedA2UPaymentQueue.findByIdAndUpdate.mockResolvedValue({
      ...a2uPaymentQueueRecord,
      status: A2U_STATUS.PENDING,
      last_error: 'Mock database error',
      updatedAt: expect.any(Date)
    });

    await runA2UPaymentQueueWorker();

    expect(mockedA2UPayment).toHaveBeenCalledWith({
      sellerPiUid: a2uPaymentQueueRecord.sellerPiUid,
      amount: a2uPaymentQueueRecord.amount.toString(),
      memo: "A2U payment",
      xRefIds: a2uPaymentQueueRecord.xRef_ids,
    });
    expect(mockedA2UPaymentQueue.findByIdAndUpdate).toHaveBeenCalledWith('mock_a2u_payment_queue_id', {
      status: A2U_STATUS.FAILED,
      updatedAt: expect.any(Date),
      last_error: 'Mock database error'
    });
  });
});