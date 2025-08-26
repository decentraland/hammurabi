import { BillboardMode } from "@dcl/protocol/out-js/decentraland/sdk/components/billboard.gen";

export function isValidBillboardCombination(billboardMode: BillboardMode) {
  return (
    billboardMode == BillboardMode.BM_NONE ||
    billboardMode == BillboardMode.BM_Y ||
    billboardMode == (BillboardMode.BM_Y | BillboardMode.BM_X) ||
    billboardMode == BillboardMode.BM_ALL
  )
}