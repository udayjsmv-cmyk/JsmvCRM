import React from 'react';
import ClientDataViewer from '../../../components/ClientDataViewer';
import { getUserRole } from '../../../utils/auth';

const FollowClients = () => {
  const role = getUserRole();
  return <ClientDataViewer role={role} title="Follow Clients" />;
};

export default FollowClients;
