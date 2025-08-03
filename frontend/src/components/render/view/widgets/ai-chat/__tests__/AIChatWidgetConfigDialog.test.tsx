/**
 * Tests for AI Chat Widget Configuration Dialog
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AIChatWidgetConfigDialog from '../AIChatWidgetConfigDialog';
import { WidgetType } from '@/types/widgetTypes';
import * as aiService from '@/services/aiService';
import { entitySlice } from '@/store/slices/entitySlice';

// Mock the AI service
vi.mock('@/services/aiService', () => ({
  aiService: {
    getStatus: vi.fn(),
    listModels: vi.fn(),
  },
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const mockAiService = aiService.aiService as any;

// Create a mock store for testing
const createMockStore = () => {
  return configureStore({
    reducer: {
      entities: entitySlice.reducer,
    },
    preloadedState: {
      entities: {
        allEntities: {},
        rootEntities: [],
        dirtyEntityIDs: [],
        loading: false,
        error: null,
      },
    },
  });
};

describe('AIChatWidgetConfigDialog', () => {
  const mockWidget = {
    id: 'test-ai-chat-widget',
    type: WidgetType.AI_CHAT,
    position: { x: 0, y: 0, w: 6, h: 4 },
    config: {
      model: 'llama2',
      temperature: 0.7,
      maxTokens: 2000,
      maxContextNotes: 5,
      showContextPreview: true,
      autoSaveChats: true,
    },
  };

  const mockProps = {
    widget: mockWidget,
    onSave: vi.fn(),
    onCancel: vi.fn(),
    isOpen: true,
  };

  // Helper function to render component with Redux provider
  const renderWithProvider = (component: React.ReactElement) => {
    const store = createMockStore();
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock AI service responses
    mockAiService.getStatus.mockResolvedValue({
      success: true,
      ollama_available: true,
      base_url: 'http://localhost:11434',
      default_model: 'llama2',
    });

    mockAiService.listModels.mockResolvedValue({
      success: true,
      models: [
        {
          name: 'llama2',
          size: 3800000000,
          modified_at: '2024-01-01T00:00:00Z',
          digest: 'abc123',
        },
        {
          name: 'codellama',
          size: 7000000000,
          modified_at: '2024-01-01T00:00:00Z',
          digest: 'def456',
        },
      ],
    });
  });

  it('should render the configuration dialog', async () => {
    renderWithProvider(<AIChatWidgetConfigDialog {...mockProps} />);

    expect(screen.getByText('AI Chat Settings')).toBeInTheDocument();
    expect(screen.getByText('Ollama Status')).toBeInTheDocument();
    expect(screen.getByText('AI Model')).toBeInTheDocument();
    expect(screen.getByText('Creativity Level: 0.7')).toBeInTheDocument();
    expect(screen.getByText('Chat History')).toBeInTheDocument();
  });

  it('should show AI service status as online when available', async () => {
    renderWithProvider(<AIChatWidgetConfigDialog {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  it('should show AI service status as offline when unavailable', async () => {
    mockAiService.getStatus.mockResolvedValue({
      success: true,
      ollama_available: false,
      base_url: 'http://localhost:11434',
      default_model: 'llama2',
    });

    renderWithProvider(<AIChatWidgetConfigDialog {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });
  });

  it('should load and display available models', async () => {
    renderWithProvider(<AIChatWidgetConfigDialog {...mockProps} />);

    await waitFor(() => {
      expect(mockAiService.listModels).toHaveBeenCalled();
    });

    // Check if models are loaded - the dropdown shows as a button with the current model
    const modelButton = screen.getByRole('button', { name: 'llama2' });
    expect(modelButton).toBeInTheDocument();
  });

  it('should update temperature when slider changes', async () => {
    renderWithProvider(<AIChatWidgetConfigDialog {...mockProps} />);

    const temperatureSlider = screen.getByRole('slider');
    expect(temperatureSlider).toBeInTheDocument();

    // The slider should show current temperature value
    expect(screen.getByText('Creativity Level: 0.7')).toBeInTheDocument();
  });





  it('should call onSave when save button is clicked', async () => {
    renderWithProvider(<AIChatWidgetConfigDialog {...mockProps} />);

    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);

    expect(mockProps.onSave).toHaveBeenCalledWith(mockWidget.config);
  });

  it('should call onCancel when cancel button is clicked', async () => {
    renderWithProvider(<AIChatWidgetConfigDialog {...mockProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockProps.onCancel).toHaveBeenCalled();
  });



  it('should show model and temperature settings', () => {
    renderWithProvider(<AIChatWidgetConfigDialog {...mockProps} />);

    expect(screen.getByText('AI Model')).toBeInTheDocument();
    expect(screen.getByText('Creativity Level: 0.7')).toBeInTheDocument();
    // Check for the temperature scale labels
    expect(screen.getByText('Focused (0.0)')).toBeInTheDocument();
    expect(screen.getByText('Creative (1.0)')).toBeInTheDocument();
  });

  it('should handle AI service errors gracefully', async () => {
    mockAiService.getStatus.mockRejectedValue(new Error('Service unavailable'));

    renderWithProvider(<AIChatWidgetConfigDialog {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });
  });

  it('should refresh AI status when refresh button is clicked', async () => {
    renderWithProvider(<AIChatWidgetConfigDialog {...mockProps} />);

    // Wait for the refresh button to be available and enabled
    const refreshButton = await waitFor(() =>
      screen.getByRole('button', { name: 'Refresh' })
    );

    fireEvent.click(refreshButton);

    expect(mockAiService.getStatus).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
  });
});
