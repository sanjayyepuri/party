import React from "react";
import { OryNodeAnchorProps } from "@ory/elements-react";

export const Anchor = ({ attributes }: OryNodeAnchorProps) => {
    return (
        <div className="text-center mt-4">
            <a
                href={attributes.href}
                title={attributes.title.text}
                className="text-xs font-mono uppercase tracking-widest text-gray-500 hover:text-black transition-colors border-b border-transparent hover:border-black pb-0.5"
            >
                {attributes.title.text}
            </a>
        </div>
    );
};
