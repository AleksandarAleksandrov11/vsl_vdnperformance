/**
 * Motor de animación de framer-motion, en su propio archivo para cargarlo
 * aparte (ver `cargarAnimaciones`). Todo lo que anima con él (las pestañas de
 * Stages y los pasos del formulario) arranca con `initial={false}` y sólo se
 * mueve cuando la persona toca algo, así que no hace falta en el primer pintado.
 */
import { domAnimation } from 'framer-motion';

export default domAnimation;
