import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, Animated } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, RotateCcw, Image as ImageIcon, Sparkles, Upload } from 'lucide-react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

const { width, height } = Dimensions.get('window');
const API_ENDPOINT = 'https://your-backend-api.vercel.app/api/recognize'; // <-- ЗАМЕНИТЕ НА СВОЙ API

export default function CameraScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [facing, setFacing] = useState<CameraType>('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!locationPermission || !locationPermission.granted) {
      requestLocationPermission();
    }
  }, [locationPermission]);


  if (!cameraPermission || !locationPermission) {
    return <View style={[styles.container, { backgroundColor: theme.colors.background }]} />;
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <LinearGradient
          colors={theme.isDark ? ['#0F172A', '#1E293B', '#334155'] : ['#F8F9FA', '#FFFFFF']}
          style={styles.permissionGradient}>
          <Camera size={64} color={theme.colors.primary} />
          <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>{t('cameraAccess')}</Text>
          <Text style={[styles.permissionText, { color: theme.colors.textSecondary }]}>
            {t('cameraPermissionText')}
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: theme.colors.primary }]}
            onPress={requestCameraPermission}>
            <Text style={styles.permissionButtonText}>{t('grantAccess')}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const processImage = async (base64Image: string) => {
    setIsProcessing(true);

    try {
      if (!locationPermission?.granted) {
          Alert.alert("Location Error", "Location permission is not granted.");
          setIsProcessing(false);
          return;
      }

      const location = await Location.getCurrentPositionAsync({});
      
      const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              image: base64Image,
              location: {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
              }
          })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to recognize the location.');
      }

      const result = await response.json();

      router.push({
        pathname: '/story',
        params: { data: JSON.stringify(result) }
      });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        Alert.alert('Processing Failed', errorMessage);
    } finally {
        setIsProcessing(false);
    }
  };


  const pickImage = async () => {
    if (isProcessing) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
        await processImage(result.assets[0].base64);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || isProcessing) return;

    setIsProcessing(true);
    try {
        const photo = await cameraRef.current.takePictureAsync({
            quality: 0.7,
            base64: true,
        });
        if(photo && photo.base64) {
            await processImage(photo.base64);
        } else {
           setIsProcessing(false);
        }
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'transparent']}
          style={styles.topOverlay}>
          <Text style={styles.instructionText}>
            {t('pointAtLandmark')}
          </Text>
        </LinearGradient>

        <View style={styles.bottomControls}>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.controlsBackground}>
            
            <View style={styles.controlsContainer}>
              <TouchableOpacity style={styles.galleryButton} onPress={pickImage} disabled={isProcessing}>
                <Upload size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.captureButton, isProcessing && styles.captureButtonActive]}
                onPress={takePicture}
                disabled={isProcessing}>
                {isProcessing ? (
                  <View style={styles.processingIndicator}>
                    <Sparkles size={32} color={theme.colors.primary} />
                  </View>
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing} disabled={isProcessing}>
                <RotateCcw size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {isProcessing && (
              <View style={styles.processingContainer}>
                <Text style={styles.processingText}>{t('recognizingLocation')}</Text>
                <Text style={styles.processingSubtext}>{t('generatingStory')}</Text>
              </View>
            )}
          </LinearGradient>
        </View>

        <View style={styles.frameContainer}>
          <View style={[styles.frameCorner, { borderColor: theme.colors.primary }]} />
          <View style={[styles.frameCorner, styles.frameCornerTopRight, { borderColor: theme.colors.primary }]} />
          <View style={[styles.frameCorner, styles.frameCornerBottomLeft, { borderColor: theme.colors.primary }]} />
          <View style={[styles.frameCorner, styles.frameCornerBottomRight, { borderColor: theme.colors.primary }]} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
  },
  permissionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
    zIndex: 1,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  controlsBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  galleryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  captureButtonActive: {
    backgroundColor: '#1E293B',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  processingIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  processingSubtext: {
    color: '#94A3B8',
    fontSize: 14,
  },
  frameContainer: {
    position: 'absolute',
    top: '35%',
    left: '15%',
    right: '15%',
    bottom: '35%',
  },
  frameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    top: 0,
    left: 0,
  },
  frameCornerTopRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderLeftWidth: 0,
  },
  frameCornerBottomLeft: {
    bottom: 0,
    top: 'auto',
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
  },
  frameCornerBottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  }
});