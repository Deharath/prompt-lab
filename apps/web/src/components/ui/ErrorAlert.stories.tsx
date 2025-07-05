import type { Meta, StoryObj } from '@storybook/react';
import ErrorAlert from './ErrorAlert.js';

const meta: Meta<typeof ErrorAlert> = {
  title: 'UI/ErrorAlert',
  component: ErrorAlert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SimpleError: Story = {
  args: {
    error: 'Something went wrong. Please try again.',
  },
};

export const DetailedError: Story = {
  args: {
    error:
      'Failed to connect to the API. Please check your internet connection and try again.',
  },
};

export const ErrorMessage: Story = {
  args: {
    error: 'Network request failed: 500 Internal Server Error',
  },
};
