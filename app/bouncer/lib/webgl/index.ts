type ReceiptCanvasType = typeof import("./receipt-canvas").ReceiptCanvas;
type ReceiptEffectType = typeof import("./receipt-effect").ReceiptEffect;

let ReceiptCanvas: ReceiptCanvasType;
let ReceiptEffect: ReceiptEffectType;

if (process.env.NODE_ENV === "test") {
  ReceiptCanvas = (({ className, pixelSize, scale } = {}) => {
    const React = require("react");
    return React.createElement("div", {
      className,
      "data-testid": "receipt-canvas-mock",
    });
  }) as ReceiptCanvasType;

  ReceiptEffect = ((() => null) as unknown) as ReceiptEffectType;
} else {
  ({ ReceiptCanvas } = require("./receipt-canvas"));
  ({ ReceiptEffect } = require("./receipt-effect"));
}

export { ReceiptCanvas, ReceiptEffect };
