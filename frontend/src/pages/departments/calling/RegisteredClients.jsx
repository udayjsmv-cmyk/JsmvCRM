import React from 'react';
import ClientDataViewer from '../../../components/ClientDataViewer';
import { getUserRole } from '../../../utils/auth';

const RegisteredClients = () => {
  const role = getUserRole();
  return <ClientDataViewer role={role} title="Registered Clients" />;
};

export default RegisteredClients;
