package ua.repairhub.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ua.repairhub.dto.request.AddPartToOrderRequest;
import ua.repairhub.dto.request.CreateOrderRequest;
import ua.repairhub.dto.response.OrderResponse;
import ua.repairhub.exception.InsufficientStockException;
import ua.repairhub.model.*;
import ua.repairhub.repository.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private DeviceRepository deviceRepository;

    @Mock
    private SparePartRepository sparePartRepository;

    @Mock
    private OrderPartRepository orderPartRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrderService orderService;

    private Client mockClient;
    private Device mockDevice;
    private Order mockOrder;
    private SparePart mockPart;

    @BeforeEach
    void setUp() {
        mockClient = Client.builder()
                .id(1L)
                .fullName("Владислав Яворський")
                .phone("+380991234567")
                .email("vlad@example.com")
                .build();

        mockDevice = Device.builder()
                .id(1L)
                .client(mockClient)
                .deviceType("Ноутбук")
                .brand("Asus")
                .model("ROG G14")
                .build();

        mockOrder = Order.builder()
                .id(1L)
                .orderNumber("SRV-2026-0001")
                .trackingCode("TRK-A1B2C3")
                .client(mockClient)
                .device(mockDevice)
                .status(OrderStatus.NEW)
                .priority(OrderPriority.HIGH)
                .defectDescription("Не вмикається після перегріву")
                .estimatedCost(BigDecimal.valueOf(500))
                .totalCost(BigDecimal.valueOf(500))
                .orderParts(new ArrayList<>())
                .orderServices(new ArrayList<>())
                .payments(new ArrayList<>())
                .build();

        mockPart = SparePart.builder()
                .id(10L)
                .sku("TH-MX4-4G")
                .name("Термопаста Arctic MX-4")
                .category("Витратні матеріали")
                .purchasePrice(BigDecimal.valueOf(150))
                .retailPrice(BigDecimal.valueOf(250))
                .stockQuantity(10)
                .minStockLimit(2)
                .build();
    }

    @Test
    @DisplayName("Створення замовлення: успішна генерація номера та прив'язка сутностей")
    void createOrder_Success() {
        CreateOrderRequest request = CreateOrderRequest.builder()
                .clientName("Владислав Яворський")
                .clientPhone("+380991234567")
                .clientEmail("vlad@example.com")
                .deviceType("Ноутбук")
                .brand("Asus")
                .model("ROG G14")
                .defectDescription("Не вмикається після перегріву")
                .priority(OrderPriority.HIGH)
                .estimatedCost(BigDecimal.valueOf(500))
                .build();

        when(clientRepository.findByPhone(request.getClientPhone())).thenReturn(Optional.of(mockClient));
        when(deviceRepository.save(any(Device.class))).thenReturn(mockDevice);
        when(orderRepository.count()).thenReturn(0L);
        when(orderRepository.save(any(Order.class))).thenReturn(mockOrder);

        OrderResponse response = orderService.createOrder(request);

        assertNotNull(response);
        assertEquals("SRV-2026-0001", response.getOrderNumber());
        assertEquals("TRK-A1B2C3", response.getTrackingCode());
        assertEquals(OrderStatus.NEW, response.getStatus());
        assertEquals(OrderPriority.HIGH, response.getPriority());
        verify(orderRepository, times(1)).save(any(Order.class));
    }

    @Test
    @DisplayName("Зміна статусу замовлення: перехід у READY_FOR_PICKUP")
    void updateOrderStatus_Success() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(mockOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.updateOrderStatus(1L, OrderStatus.READY_FOR_PICKUP);

        assertNotNull(response);
        assertEquals(OrderStatus.READY_FOR_PICKUP, response.getStatus());
        verify(orderRepository, times(1)).save(mockOrder);
    }

    @Test
    @DisplayName("Списання запчастини зі складу: зменшення залишку та перерахунок вартості")
    void addPartToOrder_Success() {
        AddPartToOrderRequest request = AddPartToOrderRequest.builder()
                .sparePartId(10L)
                .quantity(2)
                .build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(mockOrder));
        when(sparePartRepository.findById(10L)).thenReturn(Optional.of(mockPart));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.addPartToOrder(1L, request);

        assertNotNull(response);
        // Залишок на складі зменшився з 10 до 8
        assertEquals(8, mockPart.getStockQuantity());
        verify(sparePartRepository, times(1)).save(mockPart);
        verify(orderPartRepository, times(1)).save(any(OrderPart.class));
    }

    @Test
    @DisplayName("Помилка списання запчастини: викидання InsufficientStockException при дефіциті")
    void addPartToOrder_ThrowsInsufficientStock() {
        AddPartToOrderRequest request = AddPartToOrderRequest.builder()
                .sparePartId(10L)
                .quantity(20) // запитано 20, а в наявності лише 10
                .build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(mockOrder));
        when(sparePartRepository.findById(10L)).thenReturn(Optional.of(mockPart));

        assertThrows(InsufficientStockException.class, () -> orderService.addPartToOrder(1L, request));
        verify(orderPartRepository, never()).save(any(OrderPart.class));
    }
}
