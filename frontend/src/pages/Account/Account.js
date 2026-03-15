import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { AuthContext } from '../../context/AuthContext';
import AccountView from './AccountView';

const Account = () => {
    const { user, logout, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '', email: '', rol: '', pais: '', fechaNacimiento: '', idioma: []
    });

    // Estado separado para el cambio de contraseña
    const [passwords, setPasswords] = useState({ passwordActual: '', passwordNuevo: '' });

    useEffect(() => {
        // Solo sincronizar si el usuario existe y ha cambiado (o es la primera vez que lo recibimos completo)
        if (user && user.email) {
            let formattedDate = '';
            if (user.fechaNacimiento) {
                try {
                    formattedDate = new Date(user.fechaNacimiento).toISOString().split('T')[0];
                } catch (e) { }
            }

            let userIdiomas = [];
            if (user.idioma) {
                userIdiomas = Array.isArray(user.idioma) ? user.idioma : user.idioma.split(',');
            }

            setFormData({
                username: user.username || '',
                email: user.email || '',
                rol: user.rol || '',
                pais: user.pais || 'España',
                fechaNacimiento: formattedDate,
                idioma: userIdiomas
            });
        }
    }, [user]);

    // PROTECCIÓN: Si el usuario no existe, redirigir a login
    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="container py-5 mt-navbar text-center text-white">
                <div className="spinner-border text-accent mb-3" role="status"></div>
                <p className="text-uppercase fw-bold">Verificando sesión...</p>
            </div>
        );
    }

    // Si no hay email pero el AuthContext ya no está "loading", es que el perfil ha fallado
    // Renderizamos de todos modos para que el usuario no se quede bloqueado,
    // o al menos mostramos un mensaje de error si es crítico.
    if (user && !user.email) {
        return (
            <div className="container py-5 mt-navbar text-center text-white">
                <div className="spinner-border text-accent mb-3" role="status"></div>
                <p className="text-uppercase fw-bold">Sincronizando perfil...</p>
                <button className="btn btn-outline-light btn-sm mt-3" onClick={() => window.location.reload()}>
                    Reintentar conexión
                </button>
            </div>
        );
    }



    const availableLanguages = [
        { code: 'es', name: 'Español' },
        { code: 'en', name: 'Inglés' },
        { code: 'pt', name: 'Portugués' },
        { code: 'fr', name: 'Francés' },
        { code: 'de', name: 'Alemán' },
        { code: 'it', name: 'Italiano' }
    ];

    const onUpdateProfile = async (e) => {
        e.preventDefault();

        // VALIDACIONES LOCALES
        if (formData.username.trim().length < 3) {
            alert('El nombre de usuario debe tener al menos 3 caracteres.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            alert('Por favor, introduce un correo electrónico válido.');
            return;
        }

        // AVISO CONFIRMACIÓN BAJADA DE ROL
        if (user?.rol === 'organizador' && formData.rol === 'participante') {
            if (!window.confirm("ATENCIÓN: Estás a punto de cambiar tu rol a Participante. Esto borrará permanentemente TODOS los torneos que has organizado. ¿Estás absolutamente seguro/a?")) {
                return; // Cancelar guardado
            }
        }

        // Normalizar payload con los nombres de campo esperados por el backend
        const payload = { ...formData };

        try {
            await authService.updateProfile(payload);
            alert('Perfil actualizado con éxito');
            // Como el rol puede haber cambiado, forzamos recarga para que AuthContext actualice los layouts (navbar, accesos, etc)
            window.location.reload();
        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Error al actualizar perfil';
            alert(errorMsg);
        }
    };

    const onChangePassword = async (e) => {
        e.preventDefault();

        // VALIDACIÓN LOCAL
        if (passwords.passwordNuevo.length < 6) {
            alert('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }

        try {
            await authService.changePassword(passwords);
            alert('Contraseña cambiada con éxito');
            setPasswords({ passwordActual: '', passwordNuevo: '' });
        } catch (err) {
            alert(err.response?.data?.msg || 'Error al cambiar contraseña');
        }
    };

    const onDelete = async () => {
        if (window.confirm("¿ESTÁS SEGURO? Esta acción es irreversible.")) {
            try {
                await authService.deleteAccount();
                logout();
            } catch (err) { alert('Error al eliminar cuenta'); }
        }
    };

    return (
        <AccountView
            user={user}
            formData={formData}
            setFormData={setFormData}
            passwords={passwords}
            setPasswords={setPasswords}
            availableLanguages={availableLanguages}
            onUpdateProfile={onUpdateProfile}
            onChangePassword={onChangePassword}
            onDelete={onDelete}
        />
    );
};

export default Account;