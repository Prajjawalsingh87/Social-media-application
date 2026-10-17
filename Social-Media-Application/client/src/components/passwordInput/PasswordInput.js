import React, { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

// Password field with a show/hide toggle. Styles live in AuthLayout.scss (.password-field).
function PasswordInput({ id, value, onChange, placeholder, disabled, autoComplete }) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="password-field">
            <input
                type={visible ? "text" : "password"}
                className="input"
                id={id}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
                autoComplete={autoComplete}
            />
            <button
                type="button"
                className="toggle-password"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? "Hide password" : "Show password"}
                title={visible ? "Hide password" : "Show password"}
            >
                {visible ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
            </button>
        </div>
    );
}

export default PasswordInput;
