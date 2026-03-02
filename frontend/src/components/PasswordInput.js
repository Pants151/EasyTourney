import React, { useState } from 'react';

const PasswordInput = ({ className, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="position-relative">
            <input
                type={showPassword ? "text" : "password"}
                className={`${className || ''} pe-5`}
                {...props}
            />
            <span
                className="position-absolute top-50 end-0 translate-middle-y pe-3 text-white-50"
                style={{ cursor: 'pointer', zIndex: 10, transition: 'color 0.2s' }}
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Ocultar Contraseña" : "Mostrar Contraseña"}
                onMouseEnter={(e) => e.currentTarget.classList.replace('text-white-50', 'text-white')}
                onMouseLeave={(e) => e.currentTarget.classList.replace('text-white', 'text-white-50')}
            >
                {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486z" />
                        <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z" />
                        <path d="M3.35 5.462C1.708 6.731 0 8 0 8s3 5.5 8 5.5a7.029 7.029 0 0 0 2.79-.588l-.77-.771A5.944 5.944 0 0 1 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8c.058-.087.122-.183.195-.288.335-.48.83-1.12 1.465-1.755.165-.165.337-.328.517-.486z" />
                        <path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7.029 7.029 0 0 0 2.79-.588zM5.21 3.088A7.028 7.028 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474z" />
                        <path d="m13.646 14.354-12-12 .708-.708 12 12-.708.708z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
                        <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
                    </svg>
                )}
            </span>
        </div>
    );
};

export default PasswordInput;
