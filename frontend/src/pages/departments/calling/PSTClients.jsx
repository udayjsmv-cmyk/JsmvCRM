import React from 'react';
import ClientDataViewer from '../../../components/ClientDataViewer';
import { getUserRole } from '../../../utils/auth';

const PstClients = () => {
  const role = getUserRole();
  return <ClientDataViewer role={role} title="PST Clients" />;
};

export default PstClients;
