import React from "react";
import { OryNodeButtonProps } from "@ory/elements-react";

export const Button = ({ attributes, node, ...props }: OryNodeButtonProps) => {
    // Extract button text
    let buttonText = "Submit";
    if (node.meta?.label?.text) {
        buttonText = node.meta.label.text;
    } else if (attributes.value) {
        buttonText = String(attributes.value);
    }

    // Simplify common button texts
    if (buttonText.toLowerCase().includes("sign") || buttonText.toLowerCase().includes("login")) {
        buttonText = "Sign In";
    }

    return (
        <button
            name={attributes.name}
            type={attributes.type as "submit" | "button"}
            value={attributes.value}
            disabled={attributes.disabled}
            className="w-full bg-transparent text-black font-mono uppercase text-sm tracking-widest py-3 hover:bg-black hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            {...props}
        >
            {buttonText}
        </button>
    );
};
