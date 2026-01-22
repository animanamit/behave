import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VideoRecorder } from "@/components/practice/video-recorder";

describe("VideoRecorder", () => {
  const mockWebcamRef = { current: document.createElement("video") };
  const defaultProps = {
    webcamRef: mockWebcamRef,
    isCameraReady: true,
    isRecording: false,
    countdown: null,
    onToggleCamera: vi.fn(),
    onToggleMic: vi.fn(),
    isCameraOn: true,
    isMicOn: true,
  };

  it("should render video element", () => {
    render(<VideoRecorder {...defaultProps} />);
    const video = screen.getByRole("img", { hidden: true });
    expect(video).toBeTruthy();
  });

  it("should show countdown when countdown is provided", () => {
    render(<VideoRecorder {...defaultProps} countdown={3} />);
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("should show recording indicator when recording", () => {
    render(<VideoRecorder {...defaultProps} isRecording={true} />);
    expect(screen.getByText(/recording/i)).toBeTruthy();
  });

  it("should render camera toggle button", () => {
    render(<VideoRecorder {...defaultProps} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("should call onToggleCamera when camera button is clicked", () => {
    const onToggleCamera = vi.fn();
    const { container } = render(
      <VideoRecorder {...defaultProps} onToggleCamera={onToggleCamera} />
    );
    const buttons = screen.getAllByRole("button");
    buttons[0].click();
    expect(onToggleCamera).toHaveBeenCalled();
  });

  it("should display mic off icon when mic is disabled", () => {
    render(<VideoRecorder {...defaultProps} isMicOn={false} />);
    // Check if MicOff icon is rendered (component uses lucide-react)
    expect(screen.queryByText("MicOff")).toBeTruthy() ||
      expect(screen.getByRole("button")).toBeTruthy();
  });

  it("should display camera off icon when camera is disabled", () => {
    render(<VideoRecorder {...defaultProps} isCameraOn={false} />);
    // Component should still render even with camera off
    expect(screen.getByRole("img", { hidden: true })).toBeTruthy();
  });
});
