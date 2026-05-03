import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, useWindowDimensions, StatusBar, Modal, Linking, Share, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ChevronLeft, Clock, Star, Heart, Share2, ShieldCheck, CheckCircle2, Volume2, VolumeX, Play, X, Award, FileText, Package, CreditCard, Navigation, Search, Shield, Lock } from 'lucide-react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../../components/Header';
import { useFavorites } from '../../context/FavoritesContext';
export default function ServicioDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [categoriaPrincipal, setCategoriaPrincipal] = useState<string>('');
  const { toggleFavorite, isFavorite } = useFavorites();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const player = useVideoPlayer(service?.video1 || null, player => {
    player.loop = true;
    player.muted = isMuted;
    if (videoModalVisible) player.play();
  });

  useEffect(() => {
    if (player) {
      player.muted = isMuted;
    }
  }, [isMuted, player]);

  useEffect(() => {
    if (player) {
      if (videoModalVisible) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [videoModalVisible, player]);
  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'Servicios', id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as any;
          setService(data);
          if (data.categoriaIds && data.categoriaIds.length > 0) {
            const catRef = doc(db, 'CategoriasServicios', data.categoriaIds[0]);
            const catSnap = await getDoc(catRef);
            if (catSnap.exists()) {
              setCategoriaPrincipal(catSnap.data().nombre);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id, isDesktop]);
  const getPriceDisplay = (s: any): string => {
    if (!s?.weightRanges || s.weightRanges.length === 0) {
      return `CLP $${(s?.precio || 0).toLocaleString("de-DE")}`;
    }
    const prices = s.weightRanges.map((r: any) => r.price).filter((p: number) => !isNaN(p));
    if (prices.length === 0) return `CLP $${(s?.precio || 0).toLocaleString("de-DE")}`;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return `CLP $${min.toLocaleString("de-DE")}`;
    return `CLP $${min.toLocaleString("de-DE")} - $${max.toLocaleString("de-DE")}`;
  };

  const handleShare = async () => {
    if (!service) return;
    const shareUrl = `https://saku-tienda.web.app/servicio/${id}`;
    const shareText = `¡Mira este servicio en Tienda Saku: ${service.nombre}!`;

    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Tienda Saku',
              text: shareText,
              url: shareUrl
            });
            return;
          } catch (e) {
            console.log('User cancelled share');
          }
        }
        try {
          await navigator.clipboard.writeText(shareUrl);
        } catch {
          const { setStringAsync } = await import('expo-clipboard');
          await setStringAsync(shareUrl);
        }
        showToast('Enlace copiado');
      } else {
        await Share.share({
          message: Platform.OS === 'ios' ? shareText : `${shareText}\n${shareUrl}`,
          url: shareUrl,
          title: 'Tienda Saku'
        });
      }
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#63348C" />
      </View>
    );
  }
  if (!service) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#64748B' }}>Servicio no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#63348C', fontWeight: '900' }}>Volver atrás</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDesktop ? "dark-content" : "light-content"} />
      {isDesktop && <Header />}
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={isDesktop ? styles.desktopScrollContent : { paddingBottom: 120 }}
      >
        {isDesktop ? (
          <View style={styles.webRoot}>
            <View style={styles.webBgShape1} />
            <View style={styles.webBgShape2} />
            <View style={styles.webWrapper}>
              <View style={styles.webTopNav}>
                <View style={styles.breadcrumbRow}>
                  <TouchableOpacity onPress={() => router.push('/')}><Text style={styles.breadcrumbLink}>Inicio</Text></TouchableOpacity>
                  <Text style={styles.breadcrumbSep}>/</Text>
                  <TouchableOpacity onPress={() => router.back()}><Text style={styles.breadcrumbLink}>Servicios</Text></TouchableOpacity>
                  <Text style={styles.breadcrumbSep}>/</Text>
                  <Text style={styles.breadcrumbCurrent}>{service.nombre}</Text>
                </View>
                <View style={{ flex: 1 }} />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    style={styles.webActionIconBtn}
                    onPress={handleShare}
                  >
                    <Share2 size={20} color="#64748B" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.webActionIconBtn}
                    onPress={() => toggleFavorite({
                      id: service.id,
                      name: service.nombre,
                      price: service.precio,
                      image: service.foto1 || service.foto,
                      type: 'service',
                      description: service.descripcion,
                      duration: service.duracion || 'Consultar',
                      category: categoriaPrincipal || 'Servicios'
                    })}
                  >
                    <Heart
                      size={20}
                      color={isFavorite(service.id) ? "#EF4444" : "#64748B"}
                      fill={isFavorite(service.id) ? "#EF4444" : "transparent"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.webMainGrid}>
                <View style={styles.webLeftCol}>
                  <View style={styles.webGalleryContainer}>
                    <Image
                      source={{ uri: service.foto1 || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=800' }}
                      style={styles.webMainImage}
                      resizeMode="cover"
                    />
                    {service.video1 ? (
                      <TouchableOpacity
                        style={styles.webVideoOverlay}
                        onPress={() => setVideoModalVisible(true)}
                        activeOpacity={0.9}
                      >
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.7)']}
                          style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.webPlayIconLarge}>
                          <Play size={32} color="#63348C" fill="#63348C" />
                        </View>
                        <Text style={styles.webVideoText}>Ver video del servicio</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <View style={{ marginTop: 40 }}>
                    <Text style={styles.webHeroTitle}>{service.nombre} - Protección Integral</Text>
                    <Text style={styles.webHeroTagline}>Cuida a tu compañero con vacunas certificadas y un equipo experto.</Text>
                  </View>
                  <View style={styles.webDividerLarge} />
                  <View style={styles.webInfoSection}>
                    <Text style={styles.webSectionTitle}>¿Cómo Funciona el Proceso?</Text>
                    <View style={styles.processStepsGrid}>
                      {[
                        { n: '1', t: 'Reserva Online', d: 'Reserva cita rápido a través de nuestra web.' },
                        { n: '2', t: 'Confirma Cita', d: 'Recibirás un correo confirmando tu cita.' },
                        { n: '3', t: 'Visita Veterinaria', d: 'Nuestros expertos te esperan con tu mascota.' },
                        { n: '4', t: 'Seguimiento', d: 'Te enviaremos el reporte digital a tu correo.' }
                      ].map((step, idx) => (
                        <View key={idx} style={styles.stepCard}>
                          <View style={styles.stepNumberCircle}><Text style={styles.stepNumberText}>{step.n}</Text></View>
                          <View>
                            <Text style={styles.stepTitle}>{step.t}</Text>
                            <Text style={styles.stepDesc}>{step.d}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={styles.webDividerLarge} />
                  <View style={styles.webInfoSection}>
                    <Text style={styles.webSectionTitle}>Sobre este servicio</Text>
                    <Text style={styles.webDescriptionText}>{service.descripcion || 'Sin descripción disponible.'}</Text>
                  </View>
                  <View style={styles.webDividerLarge} />
                  <View style={styles.trustBadgesRow}>
                    <View style={styles.trustBadgeItem}>
                      <ShieldCheck size={20} color="#63348C" />
                      <Text style={styles.trustBadgeText}>Calidad Saku Garantizada</Text>
                    </View>
                    <View style={styles.trustBadgeItem}>
                      <CreditCard size={20} color="#63348C" />
                      <Text style={styles.trustBadgeText}>Pagos con Visa y Mastercard</Text>
                    </View>
                    <View style={styles.trustBadgeItem}>
                      <Award size={20} color="#63348C" />
                      <Text style={styles.trustBadgeText}>Especialistas Certificados</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.webRightCol}>
                  <View style={styles.webStickyContainer}>
                    <View style={styles.webPurchaseCard}>
                      <View style={styles.webTagRow}>
                        {categoriaPrincipal ? (
                          <View style={styles.webCategoryTag}>
                            <Text style={styles.webCategoryTagText}>{categoriaPrincipal}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.webPurchaseTitle}>{service.nombre}</Text>
                      <Text style={styles.webPurchaseSubtitle}>Completa protección y bienestar para tu mascota.</Text>
                      <View style={styles.webPriceSection}>
                        <Text style={styles.webPriceValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{getPriceDisplay(service)}</Text>
                      </View>
                      <View style={styles.webDividerSmall} />
                      <View style={styles.webDetailList}>
                        <View style={styles.webDetailItem}>
                          <Clock size={20} color="#64748B" />
                          <View>
                            <Text style={styles.webDetailLabel}>Duración</Text>
                            <Text style={styles.webDetailValue}>{service.duracion || 'Consultar'}</Text>
                          </View>
                        </View>
                        <View style={styles.webDetailItem}>
                          <ShieldCheck size={20} color="#64748B" />
                          <View>
                            <Text style={styles.webDetailLabel}>Garantía</Text>
                            <Text style={styles.webDetailValue}>100% Satisfacción</Text>
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.webReserveBtn}
                        onPress={() => router.push({
                          pathname: '/checkout-servicio',
                          params: {
                            serviceId: service.id,
                            serviceData: JSON.stringify(service)
                          }
                        })}
                      >
                        <Text style={styles.webReserveBtnText}>Reservar Ahora</Text>
                      </TouchableOpacity>
                      <View style={styles.webTrustBadge}>
                        <ShieldCheck size={20} color="#10B981" />
                        <Text style={styles.webTrustText}>Servicio asegurado por Saku Protection</Text>
                      </View>
                    </View>
                    <View style={styles.webSupportBox}>
                      <Text style={styles.webSupportTitle}>¿Tienes alguna duda?</Text>
                      <Text style={styles.webSupportText}>Nuestros expertos están listos para ayudarte con cualquier consulta técnica.</Text>
                      <TouchableOpacity
                        style={styles.webSupportLink}
                        onPress={() => Linking.openURL('https://wa.me/56983781062')}
                      >
                        <Text style={styles.webSupportLinkText}>Hablar con un asesor</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.mediaContainer}>
              <Image
                source={{ uri: service.foto1 || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=800' }}
                style={styles.media}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.4)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.topActions}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                  <ChevronLeft size={24} color="#fff" strokeWidth={3} />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={handleShare}
                  >
                    <Share2 size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => toggleFavorite({
                      id: service.id,
                      name: service.nombre,
                      price: service.precio,
                      image: service.foto1 || service.foto,
                      type: 'service',
                      description: service.descripcion,
                      duration: service.duracion || 'Consultar',
                      category: categoriaPrincipal || 'Servicios'
                    })}
                  >
                    <Heart
                      size={20}
                      color={isFavorite(service.id) ? "#EF4444" : "#fff"}
                      fill={isFavorite(service.id) ? "#EF4444" : "transparent"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              {service.video1 ? (
                <TouchableOpacity
                  style={styles.playVideoBtn}
                  onPress={() => setVideoModalVisible(true)}
                  activeOpacity={0.9}
                >
                  <View style={styles.playIconContainer}>
                    <Play size={24} color="#63348C" fill="#63348C" />
                  </View>
                  <Text style={styles.playVideoText}>Ver Video</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.contentBody}>
              <View style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                <View style={{ width: '100%' }}>
                  <Text style={styles.title}>{service.nombre}</Text>
                  <View style={styles.metaRow}>
                    {categoriaPrincipal ? (
                      <>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryText}>{categoriaPrincipal}</Text>
                        </View>
                        <Text style={{ color: '#CBD5E1', marginHorizontal: 4 }}>•</Text>
                      </>
                    ) : null}
                    <View style={styles.metaItem}>
                      <Clock size={16} color="#64748B" />
                      <Text style={styles.metaTextBold}>{service.duracion || 'Consultar'}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-start', width: '100%', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' }}>
                  <Text style={styles.priceValue}>{getPriceDisplay(service)}</Text>
                </View>
              </View>
              <Text style={styles.sectionTitle}>Acerca del servicio</Text>
              <Text style={styles.description}>{service.descripcion || 'Sin descripción disponible.'}</Text>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>¿Cómo Funciona el Proceso?</Text>
              <View style={{ gap: 16, marginTop: 15 }}>
                {[
                  { n: '1', t: 'Reserva Online', d: 'Reserva cita rápido a través de nuestra web.' },
                  { n: '2', t: 'Confirma Cita', d: 'Recibirás un correo confirmando tu cita.' },
                  { n: '3', t: 'Visita Veterinaria', d: 'Nuestros expertos te esperan con tu mascota.' },
                  { n: '4', t: 'Seguimiento', d: 'Te enviaremos el reporte digital a tu correo.' }
                ].map((step, idx) => (
                  <View key={idx} style={styles.stepCard}>
                    <View style={styles.stepNumberCircle}><Text style={styles.stepNumberText}>{step.n}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stepTitle}>{step.t}</Text>
                      <Text style={styles.stepDesc}>{step.d}</Text>
                    </View>
                  </View>
                ))}
              </View>
              <View style={{ backgroundColor: '#F0FDF4', padding: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 32, borderWidth: 1, borderColor: '#DCFCE7' }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' }}>
                  <Lock size={22} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '900', color: '#166534' }}>Pago Seguro y Encriptado</Text>
                  <Text style={{ fontSize: 12, color: '#15803D', fontWeight: '700', marginTop: 2 }}>Aceptamos Visa, Mastercard y Webpay</Text>
                </View>
                <Shield size={24} color="#16A34A" />
              </View>
              <View style={{ height: 100 }} />
            </View>
          </>
        )}
      </ScrollView>
      <Modal visible={videoModalVisible} animationType="fade" transparent={true} onRequestClose={() => setVideoModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.videoWidget}>
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>Video del servicio</Text>
              <TouchableOpacity style={styles.closeWidgetBtn} onPress={() => setVideoModalVisible(false)}><X size={20} color="#1E293B" /></TouchableOpacity>
            </View>
            <View style={styles.videoContainerInner}>
              <VideoView player={player} style={styles.widgetVideo} nativeControls contentFit="cover" />
              <TouchableOpacity style={styles.widgetMuteBtn} onPress={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeX size={18} color="#fff" /> : <Volume2 size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.closeFullBtn} onPress={() => setVideoModalVisible(false)}><Text style={styles.closeFullBtnText}>Cerrar Video</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
      {!isDesktop && (
        <View style={styles.floatingBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <ShieldCheck size={28} color="#63348C" />
            <View>
              <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '600' }}>Garantía Saku</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#1E293B' }}>100% Satisfacción</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.reserveBtn}
            onPress={() => router.push({ pathname: '/checkout-servicio', params: { serviceId: service.id, serviceData: JSON.stringify(service) } })}
          >
            <Text style={styles.reserveBtnText}>Reservar Ahora</Text>
          </TouchableOpacity>
        </View>
      )}
      {toastMessage && (
        <View style={{ position: 'absolute', bottom: isDesktop ? 40 : 120, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.85)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30, zIndex: 10000 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  mediaContainer: { width: '100%', height: 350, position: 'relative' },
  media: { width: '100%', height: '100%' },
  topActions: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  playVideoBtn: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -70 }, { translateY: -35 }], flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  playIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  playVideoText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  contentBody: { padding: 24, backgroundColor: '#FFFFFF', marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  title: { fontSize: 26, fontWeight: '900', color: '#1E293B', marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  categoryBadge: { backgroundColor: 'rgba(99, 52, 140, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(99, 52, 140, 0.2)' },
  categoryText: { fontSize: 13, fontWeight: '800', color: '#63348C', textTransform: 'uppercase' },
  metaTextBold: { fontSize: 14, fontWeight: '700', color: '#334155' },
  priceContainer: { alignItems: 'flex-end' },
  priceValue: { fontSize: 24, fontWeight: '900', color: '#000000' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
  description: { fontSize: 15, color: '#475569', lineHeight: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  videoWidget: { width: '100%', maxWidth: 450, backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 20 },
  widgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  widgetTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  closeWidgetBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  videoContainerInner: { width: '100%', height: 250, backgroundColor: '#000', position: 'relative' },
  widgetVideo: { width: '100%', height: '100%' },
  widgetMuteBtn: { position: 'absolute', bottom: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  closeFullBtn: { padding: 16, alignItems: 'center', backgroundColor: '#F8FAFC' },
  closeFullBtnText: { color: '#63348C', fontWeight: '900', fontSize: 15 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitText: { fontSize: 15, color: '#334155', fontWeight: '500' },
  floatingBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 20, paddingBottom: 35, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 15 },
  reserveBtn: { backgroundColor: '#10B981', paddingHorizontal: 30, paddingVertical: 16, borderRadius: 16, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  reserveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  desktopScrollContent: { paddingBottom: 60, backgroundColor: '#FFFFFF' },
  webRoot: { flex: 1, position: 'relative', overflow: 'hidden' },
  webBgShape1: { position: 'absolute', top: -100, right: -100, width: 600, height: 600, borderRadius: 300, backgroundColor: 'rgba(99, 52, 140, 0.03)', zIndex: 0 },
  webBgShape2: { position: 'absolute', top: '40%', left: -150, width: 500, height: 500, borderRadius: 250, backgroundColor: 'rgba(99, 52, 140, 0.02)', zIndex: 0 },
  webWrapper: { maxWidth: 1200, alignSelf: 'center', width: '100%', paddingHorizontal: 40, paddingTop: 40, zIndex: 1 },
  webTopNav: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  breadcrumbRow: { flexDirection: 'row', alignItems: 'center' },
  breadcrumbLink: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  breadcrumbSep: { fontSize: 14, color: '#CBD5E1', marginHorizontal: 10 },
  breadcrumbCurrent: { fontSize: 14, color: '#1E293B', fontWeight: '700' },
  webActionIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  webMainGrid: { flexDirection: 'row', gap: 60, alignItems: 'flex-start' },
  webLeftCol: { flex: 1.6 },
  webRightCol: { flex: 1 },
  webGalleryContainer: { width: '100%', borderRadius: 32, overflow: 'hidden', backgroundColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.05, shadowRadius: 40 },
  webMainImage: { width: '100%', aspectRatio: 16 / 9 },
  webVideoOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  webPlayIconLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20 },
  webVideoText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 16 },
  webHeroTitle: { fontSize: 42, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  webHeroTagline: { fontSize: 18, color: '#64748B', marginTop: 12, lineHeight: 28 },
  webInfoSection: { marginTop: 10 },
  webSectionTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 24 },
  webDescriptionText: { fontSize: 16, color: '#475569', lineHeight: 30 },
  webDividerLarge: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 48 },
  processStepsGrid: { gap: 24 },
  stepCard: { flexDirection: 'row', gap: 20, alignItems: 'center', backgroundColor: '#F8FAFC', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  stepNumberCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#63348C', justifyContent: 'center', alignItems: 'center' },
  stepNumberText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  stepTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  stepDesc: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  trustBadgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, backgroundColor: '#F8FAFC', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  trustBadgeItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  trustBadgeText: { flex: 1, fontSize: 13, fontWeight: '800', color: '#1E293B' },
  webStickyContainer: { position: 'sticky' as any, top: 40, gap: 24 },
  webPurchaseCard: { backgroundColor: '#FFFFFF', borderRadius: 32, padding: 40, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 25 }, shadowOpacity: 0.08, shadowRadius: 50 },
  webTagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  webCategoryTag: { backgroundColor: 'rgba(99, 52, 140, 0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  webCategoryTagText: { fontSize: 12, fontWeight: '800', color: '#63348C', textTransform: 'uppercase' },
  webRatingTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  webRatingText: { fontSize: 14, fontWeight: '700', color: '#F59E0B' },
  webPurchaseTitle: { fontSize: 32, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
  webPurchaseSubtitle: { fontSize: 15, color: '#64748B', marginBottom: 32 },
  webPriceSection: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 32 },
  webPriceValue: { fontSize: 24, fontWeight: '900', color: '#000000', flexShrink: 1 },
  webPriceSub: { fontSize: 16, color: '#64748B', fontWeight: '600' },
  webDividerSmall: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 32 },
  webDetailList: { gap: 20, marginBottom: 40 },
  webDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  webDetailLabel: { fontSize: 12, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
  webDetailValue: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  webReserveBtn: { backgroundColor: '#63348C', width: '100%', paddingVertical: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#63348C', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, marginBottom: 12 },
  webReserveBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  webSecondaryBtn: { backgroundColor: '#FFFFFF', width: '100%', paddingVertical: 20, borderRadius: 20, alignItems: 'center', borderWidth: 2, borderColor: '#F1F5F9' },
  webSecondaryBtnText: { color: '#1E293B', fontSize: 18, fontWeight: '900' },
  webTrustBadge: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 32, padding: 20, backgroundColor: '#F0FDF4', borderRadius: 20 },
  webTrustText: { fontSize: 13, color: '#166534', fontWeight: '700' },
  webSupportBox: { backgroundColor: '#F8FAFC', borderRadius: 24, padding: 32, borderWidth: 1, borderColor: '#F1F5F9' },
  webSupportTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  webSupportText: { fontSize: 14, color: '#64748B', lineHeight: 22, marginBottom: 16 },
  webSupportLink: { alignSelf: 'flex-start' },
  webSupportLinkText: { fontSize: 14, color: '#63348C', fontWeight: '800', textDecorationLine: 'underline' }
});
