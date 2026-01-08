import { ReceiptCanvas } from "@/lib/webgl/receipt-canvas";

export default function ReceiptTestPage() {
  return (
    <div
      className="fixed inset-0 w-screen h-screen"
      style={{ width: "100vw", height: "100vh" }}
    >
      <ReceiptCanvas className="w-full h-full" pixelSize={8.0} />
    </div>
  );
}
