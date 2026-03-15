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


    const [passwords, setPasswords] = useState({ passwordActual: '', passwordNuevo: '' });

    useEffect(() => {
        const syncData = async () => {
            if (!user) return;

            let fullUser = user;
            // Completar perfil incompleto del login
            if (!user.email) {
                try {
                    fullUser = await authService.getProfile();
                } catch (e) {
                    console.error("Error obteniendo perfil completo", e);
                    return;
                }
            }

            let formattedDate = '';
            if (fullUser.fechaNacimiento) {
                try {
                    formattedDate = new Date(fullUser.fechaNacimiento).toISOString().split('T')[0];
                } catch (e) { }
            }

            let userIdiomas = [];
            if (fullUser.idioma) {
                userIdiomas = Array.isArray(fullUser.idioma) ? fullUser.idioma : fullUser.idioma.split(',');
            }

            setFormData({
                username: fullUser.username || '',
                email: fullUser.email || '',
                rol: fullUser.rol || '',
                pais: fullUser.pais || 'España',
                fechaNacimiento: formattedDate,
                idioma: userIdiomas
            });
        };

        syncData();
    }, [user]);

    // Redirigir sin sesión
    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    if (!user || (user && !user.email && formData.email === '')) {

        return (
            <div className="container py-5 mt-navbar text-center text-white">
                <div className="spinner-border text-accent mb-3" role="status"></div>
                <p className="text-uppercase fw-bold">Cargando datos de tu cuenta...</p>
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


        if (formData.username.trim().length < 3) {
            alert('El nombre de usuario debe tener al menos 3 caracteres.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            alert('Por favor, introduce un correo electrónico válido.');
            return;
        }

        // Confirmar bajada de rol
        if (user?.rol === 'organizador' && formData.rol === 'participante') {
            if (!window.confirm("ATENCIÓN: Estás a punto de cambiar tu rol a Participante. Esto borrará permanentemente TODOS los torneos que has organizado. ¿Estás absolutamente seguro/a?")) {
                return;
            }
        }

        const payload = { ...formData };

        try {
            await authService.updateProfile(payload);
            alert('Perfil actualizado con éxito');
            // Recargar para aplicar cambios de layout/rol
            window.location.reload();
        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Error al actualizar perfil';
            alert(errorMsg);
        }
    };

    const onChangePassword = async (e) => {
        e.preventDefault();


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