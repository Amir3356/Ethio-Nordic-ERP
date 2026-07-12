<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Finance\FinanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinanceController extends Controller
{
    public function __construct(private readonly FinanceService $finance)
    {
    }

    public function overview(): JsonResponse
    {
        return $this->finance->overview();
    }

    public function storeAccount(Request $request): JsonResponse
    {
        return $this->finance->storeAccount($request);
    }

    public function updateAccount(Request $request, string $id): JsonResponse
    {
        return $this->finance->updateAccount($request, $id);
    }

    public function storeJournalEntry(Request $request): JsonResponse
    {
        return $this->finance->storeJournalEntry($request);
    }

    public function approveJournalEntry(Request $request, string $id): JsonResponse
    {
        return $this->finance->approveJournalEntry($request, $id);
    }

    public function storeApInvoice(Request $request): JsonResponse
    {
        return $this->finance->storeApInvoice($request);
    }

    public function approveApInvoice(string $id): JsonResponse
    {
        return $this->finance->approveApInvoice($id);
    }

    public function payApInvoice(Request $request, string $id): JsonResponse
    {
        return $this->finance->payApInvoice($request, $id);
    }

    public function storeArInvoice(Request $request): JsonResponse
    {
        return $this->finance->storeArInvoice($request);
    }

    public function recordArPayment(Request $request, string $id): JsonResponse
    {
        return $this->finance->recordArPayment($request, $id);
    }

    public function storeBankTransaction(Request $request): JsonResponse
    {
        return $this->finance->storeBankTransaction($request);
    }

    public function reconcileBankTransaction(string $id): JsonResponse
    {
        return $this->finance->reconcileBankTransaction($id);
    }

    public function storeBudget(Request $request): JsonResponse
    {
        return $this->finance->storeBudget($request);
    }

    public function storeFixedAsset(Request $request): JsonResponse
    {
        return $this->finance->storeFixedAsset($request);
    }

    public function closePeriod(Request $request): JsonResponse
    {
        return $this->finance->closePeriod($request);
    }

    public function reopenPeriod(Request $request): JsonResponse
    {
        return $this->finance->reopenPeriod($request);
    }

    public function statements(Request $request): JsonResponse
    {
        return $this->finance->statements($request);
    }
}
