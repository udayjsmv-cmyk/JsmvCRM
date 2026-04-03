import React from 'react';
import ClientDataViewer from '../../../components/ClientDataViewer';
import { getUserRole } from '../../../utils/auth';

const UnpaidClients = () => {
  const role = getUserRole();
  return <ClientDataViewer role={role} title="Un-paid Clients" />;
};

export default UnpaidClients;
