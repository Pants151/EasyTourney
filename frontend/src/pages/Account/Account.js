import React, { useState, useEffect, useContext } from 'react';
import authService from '../../services/authService';
import { AuthContext } from '../../context/AuthContext';
import AccountView from './AccountView';

const Account = () => {
    const { user, logout } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        username: '', email: '', rol: '', pais: '', fechaNacimiento: '', idioma: []
    });
    // Estado separado para el cambio de contraseña
    const [passwords, setPasswords] = useState({ passwordActual: '', passwordNuevo: '' });

    useEffect(() => {
        if (user) {
            // Formatear la fechaNacimiento de ISO (2000-01-01T00:00:00.000Z) a AAAA-MM-DD para el input type="date"
            let formattedDate = '';
            if (user.fechaNacimiento) {
                formattedDate = new Date(user.fechaNacimiento).toISOString().split('T')[0];
            }

            // Asegurar que el idioma sea siempre un array (ya que en la BD es a veces String)
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