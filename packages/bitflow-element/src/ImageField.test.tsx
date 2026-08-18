import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ImageField } from "./ImageField";
import { readImageFile } from "./readImage";

const pixel =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const setup = (value = { src: "", alt: "" }) => {
  const onChange = vi.fn();
  const utils = render(
    <ImageField value={value} locale="en" onChange={onChange} />,
  );
  const last = () => onChange.mock.calls[onChange.mock.calls.length - 1][0];
  return { onChange, last, ...utils };
};

/** A chosen file, as the input reports it. */
const choose = (input: HTMLElement, file: File) => {
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  fireEvent.change(input);
};

describe("<ImageField>", () => {
  it("asks for the picture and what it shows in one place", () => {
    setup();

    // Two halves of one decision: an image with no alternative text is a task
    // that does not exist for part of the class.
    expect(screen.getByLabelText("Picture")).toBeDefined();
    expect(screen.getByLabelText(/What the picture shows/)).toBeDefined();
  });

  it("shows what a stored picture costs the file", () => {
    setup({ src: pixel, alt: "A dot" });

    // An author choosing a photograph should see it become half a megabyte.
    expect(screen.getByText(/inside the file/)).toBeDefined();
  });

  it("previews the picture without repeating its description", () => {
    const { container } = setup({ src: pixel, alt: "A dot" });
    const preview = container.querySelector("img.bitflow-image-preview")!;

    // The alt text is already on screen in its own field; announcing it twice
    // is noise.
    expect(preview.getAttribute("alt")).toBe("");
  });

  it("removes the picture but keeps what was written about it", () => {
    const { last } = setup({ src: pixel, alt: "A dot" });

    fireEvent.click(screen.getByRole("button", { name: "Remove the picture" }));

    // Replacing a picture should not mean retyping its description.
    expect(last()).toEqual({ src: "", alt: "A dot" });
  });

  it("warns about a picture that is linked rather than stored", () => {
    setup({ src: "https://example.org/cpu.png", alt: "A CPU" });

    expect(screen.getByText(/linked rather than stored/)).toBeDefined();
  });

  it("says nothing of the sort about a stored one", () => {
    setup({ src: pixel, alt: "A dot" });
    expect(screen.queryByText(/linked rather than stored/)).toBeNull();
  });

  it("embeds a chosen picture and suggests a description from its name", async () => {
    const { last } = setup();
    const svg = new File(["<svg xmlns='http://www.w3.org/2000/svg'/>"], "cpu-diagram.svg", {
      type: "image/svg+xml",
    });

    choose(screen.getByLabelText("Picture"), svg);
    await vi.waitFor(() => expect(last()).toBeDefined());

    expect(last().src.startsWith("data:image/svg+xml")).toBe(true);
    // Something to correct rather than an empty box to invent from.
    expect(last().alt).toBe("cpu diagram");
  });

  it("does not overwrite a description that was already written", async () => {
    const { last } = setup({ src: "", alt: "The processor's layout" });
    const svg = new File(["<svg xmlns='http://www.w3.org/2000/svg'/>"], "cpu.svg", {
      type: "image/svg+xml",
    });

    choose(screen.getByLabelText("Picture"), svg);
    await vi.waitFor(() => expect(last().src).not.toBe(""));

    expect(last().alt).toBe("The processor's layout");
  });

  it("reports a file it cannot read instead of storing nothing", async () => {
    setup();
    const notAnImage = new File(["nonsense"], "notes.txt", { type: "text/plain" });

    choose(screen.getByLabelText("Picture"), notAnImage);

    expect(
      await screen.findByText("That file could not be read as a picture."),
    ).toBeDefined();
  });
});

describe("readImageFile", () => {
  it("passes an SVG through untouched", async () => {
    // Already small, already scalable: rasterising it would throw both away.
    const svg = new File(["<svg xmlns='http://www.w3.org/2000/svg'/>"], "a.svg", {
      type: "image/svg+xml",
    });

    const src = await readImageFile(svg);

    expect(src.startsWith("data:image/svg+xml")).toBe(true);
  });
});
