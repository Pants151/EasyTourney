import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import AdminEditUserView from './AdminEditUserView';

const AdminEditUser = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '', email: '', rol: '', pais: '', fechaNacimiento: '', idioma: []
    });
    const [passwordNuevo, setPasswordNuevo] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await authService.getUserByIdByAdmin(id);

                let formattedDate = '';
                if (data.fechaNacimiento) {
                    // Formatear fecha para input HTML
                    formattedDate = new Date(data.fechaNacimiento).toISOString().split('T')[0];
                }

                let userIdiomas = [];
                if (data.idioma) {
                    // Asegurar que sea array (viniendo de coma o directo)
                    userIdiomas = Array.isArray(data.idioma) ? data.idioma : data.idioma.split(',');
                }

                setFormData({
                    username: data.username,
                    email: data.email,
                    rol: data.rol,
                    pais: data.pais || 'España',
                    fechaNacimiento: formattedDate,
                    idioma: userIdiomas
                });
                setLoading(false);
            } catch (err) {
                console.error(err);
                alert("Error al cargar los datos del usuario");
            }
        };
        fetchUser();
    }, [id, navigate]);

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

        if (formData.fechaNacimiento) {
            const birthDate = new Date(formData.fechaNacimiento);
            const today = new Date();
            if (birthDate > today) {
                alert('La fecha de nacimiento no puede ser en el futuro.');
                return;
            }
        }

        try {
            // Guardar cambios del perfil
            await authService.updateUserByAdmin(id, formData);
            alert('Usuario actualizado con éxito');
        } catch (err) {
            alert(err.response?.data?.msg || 'Error al actualizar usuario');
        }
    };

    const onChangePassword = async (e) => {
        e.preventDefault();

        if (passwordNuevo.length < 6) {
            alert('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }

        try {
            // Forzar nueva contraseña
            await authService.changeUserPasswordByAdmin(id, passwordNuevo);
            alert('Contraseña actualizada con éxito');
            setPasswordNuevo('');
        } catch (err) {
            alert(err.response?.data?.msg || 'Error al cambiar contraseña');
        }
    };

    if (loading) return <div className="container py-5 mt-navbar text-center text-white">Cargando datos...</div>;

    return (
        <AdminEditUserView
            formData={formData}
            setFormData={setFormData}
            availableLanguages={availableLanguages}
            onUpdateProfile={onUpdateProfile}
            passwordNuevo={passwordNuevo}
            setPasswordNuevo={setPasswordNuevo}
            onChangePassword={onChangePassword}
        />
    );
};

export default AdminEditUser;
