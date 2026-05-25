import axios from "axios";
axios.defaults.withCredentials = true;

// Definimos la URL base de tu backend
const API_URL = `${import.meta.env.VITE_API_URL}/wopi`;

const API_URL_DOCSUELTOS = `${import.meta.env.VITE_API_URL}/docsueltos`;

//const direccionCollaboraTest = `https://office.cumbre.com.bo/browser/dist/cool.html`
const direccionCollaboraProduccion = `https://office.legaly.local/browser/dist/cool.html`

const wopiURL = (docId) => {
  const URL = `${direccionCollaboraProduccion}?WOPISrc=${API_URL}/files/${docId}`;
  return URL;
};

const wopiURLDocSueltos = (docId) => {
  const URL = `${direccionCollaboraProduccion}?WOPISrc=${API_URL_DOCSUELTOS}/files/${docId}`;
  return URL;
};

const wopiDocServices = {
  wopiURL,
  wopiURLDocSueltos,
};

export default wopiDocServices;
