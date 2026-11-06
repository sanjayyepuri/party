import { act, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FallSpiral } from "../fall-spiral";

let reducedMotion = false;
beforeEach(() => {
  reducedMotion = false;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: jest.fn(() => ({
      matches: reducedMotion,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
});
afterEach(() => jest.restoreAllMocks());

describe("FallSpiral", () => {
  it("keeps the print fallback when WebGL is unavailable", () => {
    jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { container } = render(<FallSpiral />);
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/images/time-to-fall-spiral.webp"
    );
    expect(container.querySelector("canvas")).toHaveStyle({ opacity: "0" });
  });
  it("does not initialize a GPU context for reduced motion or static card previews", () => {
    const getContext = jest
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(null);
    reducedMotion = true;
    const { unmount } = render(<FallSpiral />);
    expect(getContext).not.toHaveBeenCalled();
    unmount();
    reducedMotion = false;
    render(<FallSpiral animated={false} />);
    expect(getContext).not.toHaveBeenCalled();
  });
  it("returns to the print fallback and stops frames after context loss", () => {
    const gl = {
      createShader: jest.fn(() => ({})),
      shaderSource: jest.fn(),
      compileShader: jest.fn(),
      getShaderParameter: jest.fn(() => true),
      deleteShader: jest.fn(),
      createProgram: jest.fn(() => ({})),
      attachShader: jest.fn(),
      bindAttribLocation: jest.fn(),
      linkProgram: jest.fn(),
      getProgramParameter: jest.fn(() => true),
      useProgram: jest.fn(),
      deleteProgram: jest.fn(),
      createBuffer: jest.fn(() => ({})),
      bindBuffer: jest.fn(),
      bufferData: jest.fn(),
      enableVertexAttribArray: jest.fn(),
      vertexAttribPointer: jest.fn(),
      deleteBuffer: jest.fn(),
      getUniformLocation: jest.fn(() => ({})),
      uniform2f: jest.fn(),
      uniform1f: jest.fn(),
      viewport: jest.fn(),
      drawArrays: jest.fn(),
    };
    jest
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(gl as unknown as WebGLRenderingContext);
    jest.spyOn(window, "requestAnimationFrame").mockReturnValue(42);
    const cancel = jest.spyOn(window, "cancelAnimationFrame");
    const { container, unmount } = render(<FallSpiral />);
    expect(gl.drawArrays).toHaveBeenCalled();
    const canvas = container.querySelector("canvas")!;
    expect(canvas).toHaveStyle({ opacity: "1" });
    act(() =>
      canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }))
    );
    expect(canvas).toHaveStyle({ opacity: "0" });
    expect(cancel).toHaveBeenCalledWith(42);
    unmount();
    expect(gl.deleteProgram).toHaveBeenCalled();
    expect(gl.deleteBuffer).toHaveBeenCalled();
  });
});
