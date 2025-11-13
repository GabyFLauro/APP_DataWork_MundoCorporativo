import React from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import styled from 'styled-components/native';
import theme from '../styles/theme';

interface TimeSlotListProps {
    onSelectTime: (time: string) => void;
    selectedTime?: string;
    style?: ViewStyle;
}

interface StyledProps {
    isSelected: boolean;
}

const TimeSlotList: React.FC<TimeSlotListProps> = ({
    onSelectTime,
    selectedTime,
    style,
}) => {
    // Gera horários de 30 em 30 minutos das 9h às 18h
    const generateTimeSlots = () => {
        const slots: string[] = [];
        for (let hour = 9; hour < 18; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        return slots;
    };

    const timeSlots = generateTimeSlots();

    return (
        <Container style={style}>
            <TimeGrid>
                {timeSlots.map((time) => (
                    <TimeCard
                        key={time}
                        onPress={() => onSelectTime(time)}
                        isSelected={selectedTime === time}
                    >
                        <TimeText isSelected={selectedTime === time}>{time}</TimeText>
                    </TimeCard>
                ))}
            </TimeGrid>
        </Container>
    );
};

const Container = styled.View`
  padding: 16px;
`;

const TimeGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px; /* Adiciona espaçamento entre os itens */
`;

const TimeCard = styled.TouchableOpacity<{ isSelected: boolean }>`
  width: 48%;
  padding: 12px 8px;
  margin-bottom: 12px;
  border-radius: 8px;
  border: 1px solid ${props => props.isSelected ? '#007AFF' : '#E5E5EA'};
  background-color: ${props => props.isSelected ? '#007AFF' : '#FFFFFF'};
  align-items: center;
  justify-content: center;
  min-height: 44px; /* Altura mínima para touch targets */
`;

const TimeText = styled.Text<{ isSelected: boolean }>`
  color: ${props => props.isSelected ? '#FFFFFF' : '#000000'};
  font-size: 16px;
  font-weight: 500;
`;
export default TimeSlotList; 