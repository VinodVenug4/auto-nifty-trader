import React from 'react';
import { StyleSheet, View, Text as RNText, TextInput as RNInput, Pressable, TextProps, Platform } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#0b0f14' },
  card: { backgroundColor: '#151b22', padding: 12, borderRadius: 14, marginVertical: 6 },
  text: { color: '#e6edf3' },
  input: { backgroundColor: '#10151b', color: '#e6edf3', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#26313e' },
  button: { backgroundColor: '#2e7d32', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },
  buttonSecondary: { backgroundColor: '#1f2937' },
  buttonDanger: { backgroundColor: '#b91c1c' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },
});


export const MyText = (props: TextProps & { style?: any }) => {
  const { style, ...rest } = props;
  return <RNText {...rest} style={[styles.text, style]} />;
};

export const Text = MyText;


export const TextInput = ({ label, style, multiline, numberOfLines, ...rest }: any) => (
  <View style={{ flex: 1 }}>
    {label ? <MyText style={{ marginBottom: 6, opacity: 0.8 }}>{label}</MyText> : null}
    <RNInput 
      {...rest} 
      style={[
        styles.input, 
        multiline && { 
          height: numberOfLines ? numberOfLines * 40 : 80,
          textAlignVertical: 'top',
          paddingTop: 10
        },
        style
      ]}
      multiline={multiline}
      numberOfLines={numberOfLines}
      maxLength={multiline ? 2000 : 100} // Allow longer text for multiline
    />
  </View>
);
export const Button = ({ title, onPress, variant = 'primary', disabled, style }: any) => {
  const [isPressed, setIsPressed] = React.useState(false);
  
  const handlePress = () => {
    if (disabled || isPressed) return;
    setIsPressed(true);
    onPress?.();
    setTimeout(() => setIsPressed(false), 300); // Prevent double-click for 300ms
  };
  
  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        variant === 'destructive' && styles.buttonDanger,
        variant === 'outline' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#26313e' },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        (disabled || isPressed) && { opacity: 0.5 },
        style
      ]}
    >
      <MyText style={{ fontWeight: '700', textAlign: 'center' }}>{title}</MyText>
    </Pressable>
  );
};
export const Card = ({ children }: any) => <View style={styles.card}>{children}</View>;
export const Row = ({ children }: any) => <View style={styles.row}>{children}</View>;

export const Switch = ({ value, onValueChange, label }: any) => {
  const [isPressed, setIsPressed] = React.useState(false);
  
  const handlePress = () => {
    if (isPressed) return;
    setIsPressed(true);
    const newValue = !value;
    console.log('Switch: changing from', value, 'to', newValue);
    onValueChange?.(newValue);
    setTimeout(() => setIsPressed(false), 500);
  };
  
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 }}>
      {label && <Text>{label}</Text>}
      <Pressable 
        onPress={handlePress}
        style={[
          styles.button, 
          { 
            backgroundColor: value ? '#2e7d32' : '#666', 
            paddingVertical: 6, 
            paddingHorizontal: 12,
            opacity: isPressed ? 0.7 : 1
          }
        ]}
      >
        <Text style={{ fontSize: 12 }}>{value ? 'ON' : 'OFF'}</Text>
      </Pressable>
    </View>
  );
};

export const StatusBadge = ({ status, text }: any) => {
  const getColor = () => {
    switch (status) {
      case 'active': return '#2e7d32';
      case 'profit': return '#059669';
      case 'loss': return '#dc2626';
      case 'long': return '#2563eb';
      case 'short': return '#dc2626';
      default: return '#666';
    }
  };
  
  return (
    <View style={{ backgroundColor: getColor(), paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
      <Text style={{ fontSize: 12, fontWeight: '700' }}>
        {text || status}
      </Text>
    </View>
  );
};

export const PositionCard = ({ position, onExit }: any) => (
  <Card>
    <Row>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700' }}>{position.symbol}</Text>
        <Text style={{ fontSize: 12, opacity: 0.8 }}>Qty: {position.qty} | Entry: ₹{position.entryPrice}</Text>
      </View>
      <StatusBadge status={position.status} profit={position.pnl} />
    </Row>
    <Row>
      <Text>Current: ₹{position.currentPrice}</Text>
      <Button title="Exit" variant="danger" onPress={() => onExit(position.id)} />
    </Row>
  </Card>
);
