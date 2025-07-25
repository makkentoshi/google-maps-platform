import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Camera,
  RotateCcw,
  Image as ImageIcon,
  Sparkles,
  Upload,
} from 'lucide-react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import axios from 'axios';
import * as ImageManipulator from 'expo-image-manipulator';

const { width } = Dimensions.get('window');

export default function CameraScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [facing, setFacing] = useState<CameraType>('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, requestLocationPermission] =
    Location.useForegroundPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      if (!cameraPermission?.granted) await requestCameraPermission();
      if (!locationPermission?.granted) await requestLocationPermission();
    })();
  }, []);

  const processImage = async (base64Image: string) => {
    setIsProcessing(true);
    try {
      if (!locationPermission?.granted) {
        throw new Error('Location permission is not granted.');
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
      if (!API_BASE_URL) {
        throw new Error(
          'API URL is not configured. Please set EXPO_PUBLIC_API_BASE_URL in .env file'
        );
      }
      const API_ENDPOINT = `${API_BASE_URL}/api/recognize`;

      console.log('Requesting URL:', API_ENDPOINT);
      console.log('Base64 Image Size:', base64Image.length, 'characters');

      const response = await axios.post(API_ENDPOINT, {
        image: base64Image,
      });

      const result = response.data;

      router.push({
        pathname: '/story',
        params: { data: JSON.stringify(result) },
      });
    } catch (error) {
      let errorMessage = 'An unknown error occurred.';
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
        console.error('Axios Error Response:', error.response?.data);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      Alert.alert('Processing Failed', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImagePicked = async (uri: string) => {
    setIsProcessing(true);
    try {
      // Уменьшаем изображение до максимальной ширины 1280px, сохраняя пропорции,
      // а затем сжимаем его с качеством 0.7
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1280 } }], // Уменьшаем размер до веб-оптимального
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      if (manipulatedImage.base64) {
        await processImage(manipulatedImage.base64);
      } else {
        setIsProcessing(false);
        Alert.alert(t('errorTitle', 'Error'), 'Failed to process image.');
      }
    } catch (error) {
      setIsProcessing(false);
      Alert.alert(
        t('errorTitle', 'Error'),
        'An error occurred while processing the image.'
      );
      console.error('Image Manipulation Error:', error);
    }
  };

  const pickImage = async () => {
    if (isProcessing) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Отключаем, так как сами будем обрабатывать
      quality: 1, // Берем из галереи в максимальном качестве
      base64: false, // Не тратим ресурсы на первоначальный base64
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      await handleImagePicked(result.assets[0].uri);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || isProcessing) return;
    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });

      if (photo?.uri) {
        await handleImagePicked(photo.uri);
      } else {
        setIsProcessing(false);
      }
    } catch (error) {
      setIsProcessing(false);
      Alert.alert(
        t('errorTitle', 'Error'),
        t('errorTakePhoto', 'Failed to take photo')
      );
    }
  };

  if (!cameraPermission || !locationPermission) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      />
    );
  }
  if (!cameraPermission.granted || !locationPermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <LinearGradient
          colors={
            theme.isDark
              ? ['#0F172A', '#1E293B', '#334155']
              : ['#F8F9FA', '#FFFFFF']
          }
          style={styles.permissionGradient}
        >
          <Camera size={64} color={theme.colors.primary} />
          <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>
            {t('cameraAccess')}
          </Text>
          <Text
            style={[
              styles.permissionText,
              { color: theme.colors.textSecondary },
            ]}
          >
            {t('cameraPermissionText')}
          </Text>
          <TouchableOpacity
            style={[
              styles.permissionButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => {
              requestCameraPermission();
              requestLocationPermission();
            }}
          >
            <Text style={styles.permissionButtonText}>{t('grantAccess')}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  const toggleCameraFacing = () =>
    setFacing((current) => (current === 'back' ? 'front' : 'back'));

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
        zoom={0}
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'transparent']}
        style={styles.topOverlay}
      >
        <Text style={styles.instructionText}>{t('pointAtLandmark')}</Text>
      </LinearGradient>

      <View style={styles.frameContainer}>
        <View
          style={[styles.frameCorner, { borderColor: theme.colors.primary }]}
        />
        <View
          style={[
            styles.frameCorner,
            styles.frameCornerTopRight,
            { borderColor: theme.colors.primary },
          ]}
        />
        <View
          style={[
            styles.frameCorner,
            styles.frameCornerBottomLeft,
            { borderColor: theme.colors.primary },
          ]}
        />
        <View
          style={[
            styles.frameCorner,
            styles.frameCornerBottomRight,
            { borderColor: theme.colors.primary },
          ]}
        />
      </View>

      <View style={styles.bottomControls}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.controlsBackground}
        >
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={pickImage}
              disabled={isProcessing}
            >
              <Upload size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.captureButton,
                isProcessing && styles.captureButtonActive,
              ]}
              onPress={takePicture}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <View style={styles.processingIndicator}>
                  <Sparkles size={32} color={theme.colors.primary} />
                </View>
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={toggleCameraFacing}
              disabled={isProcessing}
            >
              <RotateCcw size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {isProcessing && (
            <View style={styles.processingContainer}>
              <Text style={styles.processingText}>
                {t('recognizingLocation')}
              </Text>
              <Text style={styles.processingSubtext}>
                {t('generatingStory')}
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  permissionContainer: { flex: 1 },
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
  permissionButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  camera: { flex: 1 },
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
    zIndex: 1,
  },
  controlsBackground: { flex: 1, justifyContent: 'flex-end' },
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
  captureButtonActive: { backgroundColor: '#1E293B' },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  processingIndicator: { justifyContent: 'center', alignItems: 'center' },
  flipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: { alignItems: 'center', paddingBottom: 20 },
  processingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  processingSubtext: { color: '#94A3B8', fontSize: 14 },
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
  },
});
