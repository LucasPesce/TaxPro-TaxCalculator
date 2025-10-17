import React from 'react';
import { Card } from '../Card/Card'; 
import styles from './ChartCard.module.css'; 

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => {

  return (
    <Card title={title} className={styles.chartCard}>

      {children}
    </Card>
  );
};