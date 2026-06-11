import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface FormattedMessageTextProps {
  text: string;
  isUser: boolean;
}

export function FormattedMessageText({ text, isUser }: FormattedMessageTextProps) {
  const textColor = isUser ? '#fff' : '#3E2723';
  const lines = text.split('\n');

  return (
    <View style={styles.textContainer}>
      {lines.map((line, lineIdx) => {
        let isBullet = false;
        let cleanLine = line;

        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          isBullet = true;
          cleanLine = line.trim().substring(2);
        }

        const parts = cleanLine.split('**');

        return (
          <View key={lineIdx} style={styles.textLineContainer}>
            <Text style={[styles.messageText, { color: textColor }]}>
              {isBullet && '• '}
              {parts.map((part, partIdx) => {
                const isBold = partIdx % 2 === 1;
                return (
                  <Text
                    key={partIdx}
                    style={isBold ? styles.boldText : undefined}
                  >
                    {part}
                  </Text>
                );
              })}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  textContainer: {
    gap: 4,
  },
  textLineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
  },
});
