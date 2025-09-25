import React, { useState, useEffect } from "react";
import { 
  StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, 
  Alert, Modal, ScrollView, SafeAreaView, StatusBar, Animated, Dimensions 
} from "react-native";

const { width, height } = Dimensions.get('window');

const API_BASE_URL = "http://localhost:3000";

export default function ClientManagementApp() {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClient, setSelectedClient] = useState({ 
    id: null, 
    name: "", 
    age: "", 
    state: "" 
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [filterText, setFilterText] = useState("");
  
  const fadeIn = useState(new Animated.Value(0))[0];
  const slideUp = useState(new Animated.Value(height))[0];
  const scaleValue = useState(new Animated.Value(0.8))[0];

  useEffect(() => {
    fetchClients();
    Animated.timing(fadeIn, { 
      toValue: 1, 
      duration: 1000, 
      useNativeDriver: true 
    }).start();
  }, []);

  const openModalWithAnimation = () => {
    setShowFormModal(true);
    Animated.parallel([
      Animated.timing(slideUp, { 
        toValue: 0, 
        duration: 450, 
        useNativeDriver: true 
      }),
      Animated.timing(scaleValue, { 
        toValue: 1, 
        duration: 450, 
        useNativeDriver: true 
      })
    ]).start();
  };

  const closeModalWithAnimation = () => {
    Animated.parallel([
      Animated.timing(slideUp, { 
        toValue: height, 
        duration: 350, 
        useNativeDriver: true 
      }),
      Animated.timing(scaleValue, { 
        toValue: 0.8, 
        duration: 350, 
        useNativeDriver: true 
      })
    ]).start(() => setShowFormModal(false));
  };

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const result = await fetch(`${API_BASE_URL}`);
      if (result.ok) {
        const clientData = await result.json();
        const formattedClients = clientData.map(client => ({ 
          ...client, 
          id: client.id || client.ID || client.IdCliente 
        }));
        setClients(formattedClients);
      } else {
        showAlert("Erro", "Falha ao carregar dados dos clientes");
      }
    } catch (error) {
      showAlert("Erro", "Servidor indisponível");
    } finally {
      setIsLoading(false);
    }
  };

  const createClient = async () => {
    if (!selectedClient.name || !selectedClient.age || !selectedClient.state) {
      showAlert("Atenção", "Todos os campos são obrigatórios");
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/clientes/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          Nome: selectedClient.name, 
          Idade: parseInt(selectedClient.age), 
          UF: selectedClient.state 
        }),
      });
      
      if (response.ok) {
        const newClient = await response.json();
        const clientWithId = { 
          ...newClient, 
          id: newClient.id || newClient.ID || newClient.IdCliente || Date.now() 
        };
        setClients(prev => [...prev, clientWithId]);
        resetForm();
        showAlert("Sucesso", "Cliente cadastrado com sucesso!");
      } else {
        showAlert("Erro", "Falha no cadastro do cliente");
      }
    } catch (error) {
      showAlert("Erro", "Problema de conexão com o servidor");
    }
  };

  const modifyClient = async () => {
    if (!selectedClient.name || !selectedClient.age || !selectedClient.state) {
      showAlert("Atenção", "Preencha todos os campos necessários");
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/clientes/${selectedClient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          Nome: selectedClient.name, 
          Idade: parseInt(selectedClient.age), 
          UF: selectedClient.state 
        }),
      });
      
      if (response.ok) {
        const updated = await response.json();
        const updatedClient = { 
          ...updated, 
          id: updated.id || updated.ID || updated.IdCliente || selectedClient.id 
        };
        setClients(prev => prev.map(client => 
          client.id === selectedClient.id ? updatedClient : client
        ));
        resetForm();
        showAlert("Sucesso", "Dados atualizados com sucesso!");
      } else {
        showAlert("Erro", "Falha na atualização dos dados");
      }
    } catch (error) {
      showAlert("Erro", "Servidor indisponível");
    }
  };

  const requestDeleteConfirmation = (clientId) => {
    setClientToDelete(clientId);
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clientes/${clientToDelete}`, { 
        method: "DELETE" 
      });
      
      if (response.ok) {
        setClients(prev => prev.filter(client => client.id !== clientToDelete));
        setShowDeleteConfirm(false);
        setClientToDelete(null);
        showAlert("Sucesso", "Cliente removido do sistema");
      } else {
        showAlert("Erro", "Falha na exclusão do cliente");
      }
    } catch (error) {
      showAlert("Erro", "Problema de conexão");
    }
  };

  const initiateAddClient = () => {
    setIsEditing(false);
    setSelectedClient({ id: null, name: "", age: "", state: "" });
    openModalWithAnimation();
  };

  const initiateEditClient = (client) => {
    setIsEditing(true);
    setSelectedClient({ 
      id: client.id, 
      name: client.Nome, 
      age: client.Idade.toString(), 
      state: client.UF 
    });
    openModalWithAnimation();
  };

  const resetForm = () => {
    setSelectedClient({ id: null, name: "", age: "", state: "" });
    closeModalWithAnimation();
    setIsEditing(false);
  };

  const showAlert = (title, message) => {
    Alert.alert(title, message);
  };

  const filteredClients = clients.filter(client =>
    client.Nome.toLowerCase().includes(filterText.toLowerCase()) ||
    client.UF.toLowerCase().includes(filterText.toLowerCase())
  );

  const ClientCard = ({ item, index }) => (
    <Animated.View style={[
      styles.clientCard,
      { 
        opacity: fadeIn,
        transform: [
          { translateY: fadeIn.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0]
          })}
        ]
      }
    ]}>
      <View style={styles.clientInitials}>
        <Text style={styles.initialsText}>
          {item.Nome.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
        </Text>
      </View>
      
      <View style={styles.clientDetails}>
        <Text style={styles.clientName}>{item.Nome}</Text>
        <View style={styles.infoContainer}>
          <View style={styles.infoTag}>
            <Text style={styles.tagText}>{item.Idade} anos</Text>
          </View>
          <View style={[styles.infoTag, styles.stateTag]}>
            <Text style={styles.tagText}>{item.UF}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.editBtn]} 
          onPress={() => initiateEditClient(item)}
        >
          <Text style={styles.btnIcon}>✎</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.removeBtn]} 
          onPress={() => requestDeleteConfirmation(item.id)}
        >
          <Text style={styles.btnIcon}>🗑</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar backgroundColor="#2D3748" barStyle="light-content" />
      
      <View style={styles.topBar}>
        <View style={styles.header}>
          <Text style={styles.appTitle}>Sistema de Clientes</Text>
          <Text style={styles.clientCount}>
            {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}
          </Text>
        </View>
        <TouchableOpacity style={styles.addClientBtn} onPress={initiateAddClient}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchField}
          placeholder="🔍 Pesquisar por nome ou estado..."
          placeholderTextColor="#A0AEC0"
          value={filterText}
          onChangeText={setFilterText}
        />
      </View>

      <FlatList
        data={filteredClients}
        keyExtractor={(item, index) => (item.id || item.ID || index).toString()}
        renderItem={ClientCard}
        refreshing={isLoading}
        onRefresh={fetchClients}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>Nenhum cliente encontrado</Text>
            <Text style={styles.emptyMessage}>
              {filterText ? 'Tente ajustar os termos da pesquisa' : 'Cadastre seu primeiro cliente'}
            </Text>
            <TouchableOpacity style={styles.reloadBtn} onPress={fetchClients}>
              <Text style={styles.reloadText}>🔄 Atualizar lista</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal transparent visible={showFormModal} onRequestClose={resetForm}>
        <View style={styles.modalBackground}>
          <Animated.View style={[
            styles.formModal,
            { 
              transform: [
                { translateY: slideUp },
                { scale: scaleValue }
              ]
            }
          ]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {isEditing ? "Editar Cadastro" : "Novo Cliente"}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome completo</Text>
                <TextInput 
                  style={styles.inputField} 
                  value={selectedClient.name}
                  onChangeText={(text) => setSelectedClient({ ...selectedClient, name: text })}
                  placeholder="Informe o nome completo"
                  placeholderTextColor="#A0AEC0"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Idade</Text>
                <TextInput 
                  style={styles.inputField} 
                  value={selectedClient.age}
                  onChangeText={(text) => setSelectedClient({ ...selectedClient, age: text })}
                  placeholder="Idade do cliente"
                  placeholderTextColor="#A0AEC0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Estado (UF)</Text>
                <TextInput 
                  style={styles.inputField} 
                  value={selectedClient.state}
                  onChangeText={(text) => setSelectedClient({ ...selectedClient, state: text.toUpperCase() })}
                  placeholder="Ex: SP, RJ, MG"
                  placeholderTextColor="#A0AEC0"
                  maxLength={2}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={resetForm}>
                  <Text style={styles.btnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.confirmBtn]} 
                  onPress={isEditing ? modifyClient : createClient}
                >
                  <Text style={styles.btnText}>{isEditing ? "Atualizar" : "Cadastrar"}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      <Modal transparent visible={showDeleteConfirm} animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.confirmationModal}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.confirmTitle}>Confirmar Exclusão</Text>
            <Text style={styles.confirmMessage}>
              Esta ação removerá permanentemente o cliente selecionado. Deseja continuar?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.btnText}>Manter</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.deleteConfirmBtn]} 
                onPress={executeDelete}
              >
                <Text style={styles.btnText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: "#ffffffff",
  },
  topBar: {
    backgroundColor: "#2D3748",
    paddingHorizontal: 24,
    paddingVertical: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  header: {
    flex: 1,
  },
  appTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  clientCount: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 15,
    fontWeight: "500",
  },
  addClientBtn: {
    backgroundColor: "#E53E3E",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    shadowColor: "#E53E3E",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  addIcon: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 26,
  },
  searchSection: {
    padding: 20,
    backgroundColor: "#2D3748",
    borderBottomWidth: 10,
    borderBottomColor: "#4A5568",
    marginTop: 25,
  },
  searchField: {
    backgroundColor: "#2D3748",
    padding: 16,
    borderRadius: 12,
    color: "#FFFFFF",
    fontSize: 16,
    borderWidth: 2,
    borderColor: "#4A5568",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  listContent: {

    
    padding: 20,
    paddingTop: 12,
  },
  clientCard: {
    backgroundColor: "#2D3748",
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#E53E3E",
  },
  clientInitials: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E53E3E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  initialsText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  clientDetails: {
    flex: 1,
    marginRight: 12,
  },
  clientName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  infoTag: {
    backgroundColor: "#4A5568",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 10,
    marginBottom: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  stateTag: {
    backgroundColor: "#E53E3E",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.4,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionBtn: {
    marginLeft: 8,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  editBtn: {
    backgroundColor: "#D69E2E",
  },
  removeBtn: {
    backgroundColor: "#E53E3E",
  },
  btnIcon: {
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 120,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 24,
    color: "#E53E3E",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 0.4,
  },
  emptyMessage: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 22,
  },
  reloadBtn: {
    backgroundColor: "#E53E3E",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 20,
    elevation: 6,
    shadowColor: "#E53E3E",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  reloadText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: 0.4,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  formModal: {
    backgroundColor: "#2D3748",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    borderWidth: 2,
    borderColor: "#4A5568",
  },
  confirmationModal: {
    backgroundColor: "#2D3748",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    borderWidth: 2,
    borderColor: "#4A5568",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#4A5568",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    marginBottom: 10,
    color: "#FFFFFF",
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  inputField: {
    borderWidth: 2,
    borderColor: "#4A5568",
    padding: 16,
    borderRadius: 12,
    fontSize: 15,
    backgroundColor: "#2D3748",
    color: "#FFFFFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  cancelBtn: {
    backgroundColor: "#718096",
  },
  confirmBtn: {
    backgroundColor: "#38A169",
  },
  deleteConfirmBtn: {
    backgroundColor: "#E53E3E",
  },
  btnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: 0.4,
  },
  warningIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  confirmMessage: {
    textAlign: "center",
    marginBottom: 24,
    fontSize: 15,
    color: "#FFFFFF",
    lineHeight: 22,
    letterSpacing: 0.3,
  },
});