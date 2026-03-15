import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import LoginView from './LoginView';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const { user, login } = useContext(AuthContext);
    const navigate = useNavigate();

    // Redirigir si ya está logueado para no sobrescribir la sesión actual accidentalmente
    React.useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            // 1. Llamamos al servicio para obtener la respuesta del servidor (token + user)
            const res = await authService.login(formData);
            // 2. Pasamos EL OBJETO COMPLETO al contexto
            login(res);
            navigate('/');
        } catch (err) {
            // 3. Si el servidor detecta una sesión y nos devuelve 409
            if (err.response && err.response.status === 409 && err.response.data.code === 'ACTIVE_SESSION') {
                const confirmForce = window.confirm("Ya hay una sesión iniciada en otro lugar, para continuar se va a cerrar la sesión anterior. ¿Deseas continuar?");
                if (confirmForce) {
                    try {
                        const resForced = await authService.login({ ...formData, forceLogout: true });
                        login(resForced);
                        navigate('/');
                    } catch (forceErr) {
                        alert('Error al forzar el inicio de sesión.');
                    }
                }
                // Si pulsa 'cancelar' en el confirm, no hacemos nada y dejamos la vieja intacta.
            } else {
                alert('Error al iniciar sesión. Comprueba tus credenciales.');
            }
        }
    };

        return (
        <LoginView
            onChange={onChange}
            onSubmit={onSubmit}
        />
    );
};

export default Login;
