import React from 'react';
import ClientDataViewer from '../../../components/ClientDataViewer';
import { getUserRole } from '../../../utils/auth';

const H4EadClients = () => {
  const role = getUserRole();
  return <ClientDataViewer role={role} title="H4 EAD Clients" />;
};

export default H4EadClients;
