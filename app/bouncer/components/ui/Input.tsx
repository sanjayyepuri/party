import React from "react";
import { useFormContext } from "react-hook-form";
import { OryNodeInputProps } from "@ory/elements-react";

export const Input = ({ attributes, node }: OryNodeInputProps) => {
    const { register } = useFormContext();
    const { value, autocomplete, name, maxlength, ...rest } = attributes;

    // Handle hidden inputs
    if (attributes.type === "hidden") {
        return (
            <input
                {...rest}
                data-testid={`ory/form/node/input/${name}`}
                {...register(name, { value })}
            />
        );
    }

    const { ref, ...restRegister } = register(name, { value });

    const labelMap: Record<string, string> = {
        identifier: "Email",
        password: "Password",
    };

    const label = labelMap[attributes.name] || attributes.name;

    return (
        <div className="mb-4 group">
            <input
                ref={ref}
                {...rest}
                autoComplete={autocomplete}
                maxLength={maxlength}
                placeholder={label.toUpperCase()}
                className="w-full appearance-none bg-transparent border-0 border-b border-black font-mono text-sm py-1 focus:outline-none focus:ring-0 focus:border-black transition-all placeholder-gray-500 rounded-none"
                data-testid={`ory/form/node/input/${name}`}
                {...restRegister}
            />
        </div>
    );
};
