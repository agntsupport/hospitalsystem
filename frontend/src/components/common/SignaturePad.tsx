// ABOUTME: Componente reutilizable de canvas para capturar firmas digitales.
// ABOUTME: Soporta touch y mouse, exporta firma como Base64 PNG para almacenar en BD.

import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
} from '@mui/material';
import {
  Clear as ClearIcon,
  Check as CheckIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

interface SignaturePadProps {
  label: string;
  width?: number;
  height?: number;
  onSignatureChange?: (signatureBase64: string | null) => void;
  disabled?: boolean;
  initialSignature?: string | null;
  showConfirmButton?: boolean;
  required?: boolean;
}

export interface SignaturePadRef {
  clear: () => void;
  getSignature: () => string | null;
  isEmpty: () => boolean;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(({
  label,
  width = 400,
  height = 150,
  onSignatureChange,
  disabled = false,
  initialSignature = null,
  showConfirmButton = true,
  required = false,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Set drawing style
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw initial signature if provided
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
        setIsConfirmed(true);
      };
      img.src = initialSignature;
    }
  }, [width, height, initialSignature]);

  // Get coordinates from event
  const getCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  }, []);

  // Start drawing
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || isConfirmed) return;
    e.preventDefault();

    const { x, y } = getCoordinates(e);
    lastPointRef.current = { x, y };
    setIsDrawing(true);
  }, [disabled, isConfirmed, getCoordinates]);

  // Draw
  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled || isConfirmed) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !lastPointRef.current) return;

    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastPointRef.current = { x, y };
    setHasSignature(true);
  }, [isDrawing, disabled, isConfirmed, getCoordinates]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPointRef.current = null;
  }, []);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setIsConfirmed(false);
    onSignatureChange?.(null);
  }, [onSignatureChange]);

  // Get signature as Base64
  const getSignatureBase64 = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return null;
    return canvas.toDataURL('image/png');
  }, [hasSignature]);

  // Check if canvas is empty
  const isEmpty = useCallback(() => {
    return !hasSignature;
  }, [hasSignature]);

  // Confirm signature
  const confirmSignature = useCallback(() => {
    if (!hasSignature) return;

    const signature = getSignatureBase64();
    setIsConfirmed(true);
    onSignatureChange?.(signature);
  }, [hasSignature, getSignatureBase64, onSignatureChange]);

  // Edit signature (unlock canvas)
  const editSignature = useCallback(() => {
    setIsConfirmed(false);
  }, []);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    clear: clearCanvas,
    getSignature: getSignatureBase64,
    isEmpty,
  }), [clearCanvas, getSignatureBase64, isEmpty]);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        bgcolor: disabled ? 'action.disabledBackground' : 'background.paper',
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <Stack spacing={1}>
        <Typography variant="subtitle2" color="text.secondary">
          {label} {required && <span style={{ color: 'red' }}>*</span>}
        </Typography>

        <Box
          sx={{
            border: '1px solid',
            borderColor: isConfirmed ? 'success.main' : 'divider',
            borderRadius: 1,
            overflow: 'hidden',
            position: 'relative',
            width: 'fit-content',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              display: 'block',
              cursor: disabled || isConfirmed ? 'not-allowed' : 'crosshair',
              touchAction: 'none',
              maxWidth: '100%',
              height: 'auto',
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          {isConfirmed && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'success.main',
                color: 'white',
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckIcon fontSize="small" />
            </Box>
          )}
        </Box>

        <Stack direction="row" spacing={1}>
          {!isConfirmed ? (
            <>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearCanvas}
                disabled={disabled || !hasSignature}
              >
                Limpiar
              </Button>
              {showConfirmButton && (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CheckIcon />}
                  onClick={confirmSignature}
                  disabled={disabled || !hasSignature}
                >
                  Confirmar Firma
                </Button>
              )}
            </>
          ) : (
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={editSignature}
              disabled={disabled}
            >
              Editar Firma
            </Button>
          )}
        </Stack>

        {!hasSignature && !isConfirmed && (
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Firme en el recuadro usando el mouse o su dedo
          </Typography>
        )}
      </Stack>
    </Paper>
  );
});

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
