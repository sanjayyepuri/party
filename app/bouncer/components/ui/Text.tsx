import React from "react";
import { OryNodeTextProps } from "@ory/elements-react";

export const CustomText = ({ attributes, node }: OryNodeTextProps) => {
    // Check if the text node acts as a link (has href in attributes or context)
    // Note: Ory Text nodes might have href in attributes if they are links
    const href = (attributes as any).href;
    const title = node.meta.label?.text || (attributes as any).title?.text || (attributes as any).text?.text;

    if (href) {
        return (
            <div className="text-center mt-4">
                <a
                    href={href}
                    className="text-xs font-mono uppercase tracking-widest text-gray-500 hover:text-black transition-colors border-b border-transparent hover:border-black pb-0.5"
                >
                    {title}
                </a>
            </div>
        );
    }

    return (
        <p className="text-sm text-gray-600 font-serif mb-2" data-testid={`ory/ui/node/text/${node.meta.label?.id}`}>
            {title}
        </p>
    );
};
